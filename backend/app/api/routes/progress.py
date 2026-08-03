import random
import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, touch_user_activity
from app.db.session import get_db
from app.models import (
    Achievement,
    Category,
    Course,
    DailyChallenge,
    Lesson,
    User,
    UserAchievement,
    UserLessonProgress,
    UserStats,
)
from app.schemas import (
    AchievementPublic,
    CourseProgressPublic,
    DailyChallengePublic,
    LeaderboardEntry,
    LessonProgressPublic,
    StatsPublic,
    TrainingResult,
    TrainingSubmit,
)
from app.services.levels import level_from_xp

router = APIRouter(tags=["progress"])


DAILY_TEMPLATES = [
    ("learn_combos", "Выучить новые комбинации", 10),
    ("training", "Пройти тренировку", 1),
    ("earn_xp", "Получить XP", 200),
    ("finish_lesson", "Закончить урок", 1),
]


async def ensure_daily_challenges(user: User, db: AsyncSession) -> None:
    today = date.today()
    for ctype, _, target in DAILY_TEMPLATES:
        exists = await db.scalar(
            select(func.count())
            .select_from(DailyChallenge)
            .where(
                DailyChallenge.user_id == user.id,
                DailyChallenge.challenge_date == today,
                DailyChallenge.challenge_type == ctype,
            )
        )
        if not exists:
            db.add(
                DailyChallenge(
                    user_id=user.id,
                    challenge_date=today,
                    challenge_type=ctype,
                    target=target,
                    progress=0,
                    completed=False,
                    xp_reward=25,
                )
            )


@router.post("/training/submit", response_model=TrainingResult)
async def submit_training(
    body: TrainingSubmit,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await touch_user_activity(user)
    xp_gained = 0
    if body.correct:
        lesson = await db.get(Lesson, body.lesson_id)
        xp_gained = lesson.xp_reward if lesson else 10
        user.xp = (user.xp or 0) + xp_gained
        user.level, _ = level_from_xp(user.xp)

        prog = await db.scalar(
            select(UserLessonProgress).where(
                UserLessonProgress.user_id == user.id,
                UserLessonProgress.lesson_id == body.lesson_id,
            )
        )
        if not prog:
            prog = UserLessonProgress(
                user_id=user.id,
                lesson_id=body.lesson_id,
                attempts=0,
                correct_count=0,
                completed=False,
            )
            db.add(prog)
        prog.attempts = (prog.attempts or 0) + 1
        prog.correct_count = (prog.correct_count or 0) + 1
        prog.completed = True

        stats = await db.scalar(select(UserStats).where(UserStats.user_id == user.id))
        if not stats:
            stats = UserStats(
                user_id=user.id,
                total_correct=0,
                total_wrong=0,
                avg_response_ms=0,
            )
            db.add(stats)
        stats.total_correct = (stats.total_correct or 0) + 1
        if body.response_time_ms:
            prev = stats.avg_response_ms or 0
            stats.avg_response_ms = int((prev + body.response_time_ms) / 2) if prev else body.response_time_ms

    else:
        stats = await db.scalar(select(UserStats).where(UserStats.user_id == user.id))
        if not stats:
            stats = UserStats(
                user_id=user.id,
                total_correct=0,
                total_wrong=0,
                avg_response_ms=0,
            )
            db.add(stats)
        stats.total_wrong = (stats.total_wrong or 0) + 1

    await ensure_daily_challenges(user, db)
    await db.flush()
    today = date.today()
    if body.correct:
        for row in (
            await db.scalars(
                select(DailyChallenge).where(
                    DailyChallenge.user_id == user.id,
                    DailyChallenge.challenge_date == today,
                )
            )
        ).all():
            if row.challenge_type in ("earn_xp", "training", "finish_lesson", "learn_combos"):
                if row.completed:
                    continue
                row.progress = min(row.target, (row.progress or 0) + 1)
                if row.progress >= row.target:
                    row.completed = True
                    bonus = row.xp_reward or 25
                    user.xp = (user.xp or 0) + bonus
                    xp_gained += bonus

    level, title = level_from_xp(user.xp or 0)
    user.level = level
    await db.commit()
    return TrainingResult(
        xp_gained=xp_gained,
        total_xp=user.xp,
        level=user.level,
        level_title=title,
        streak_days=user.streak_days or 0,
    )


@router.get("/achievements", response_model=list[AchievementPublic])
async def list_achievements(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    achievements = (await db.scalars(select(Achievement))).all()
    unlocked = {
        ua.achievement_id: ua.unlocked_at
        for ua in (await db.scalars(select(UserAchievement).where(UserAchievement.user_id == user.id))).all()
    }
    return [
        AchievementPublic(
            id=a.id,
            slug=a.slug,
            title=a.title,
            description=a.description,
            icon=a.icon,
            xp_bonus=a.xp_bonus,
            unlocked=a.id in unlocked,
            unlocked_at=unlocked.get(a.id),
        )
        for a in achievements
    ]


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    period: str = Query("all", pattern="^(all|week|month)$"),
    db: AsyncSession = Depends(get_db),
):
    _ = period
    users = (await db.scalars(select(User).order_by(User.xp.desc()).limit(50))).all()
    out: list[LeaderboardEntry] = []
    for i, u in enumerate(users, start=1):
        _, title = level_from_xp(u.xp)
        out.append(
            LeaderboardEntry(
                rank=i,
                username=u.username,
                display_name=u.display_name,
                xp=u.xp,
                level=u.level,
                level_title=title,
            )
        )
    return out


@router.get("/progress/lessons", response_model=list[LessonProgressPublic])
async def lesson_progress(
    course_slug: str | None = Query(None),
    lesson_id: uuid.UUID | None = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Per-lesson learned status from existing UserLessonProgress."""
    q = (
        select(Lesson, Course.slug, UserLessonProgress)
        .join(Category, Lesson.category_id == Category.id)
        .join(Course, Category.course_id == Course.id)
        .outerjoin(
            UserLessonProgress,
            (UserLessonProgress.lesson_id == Lesson.id) & (UserLessonProgress.user_id == user.id),
        )
        .order_by(Course.sort_order, Category.sort_order, Lesson.sort_order)
    )
    if course_slug:
        q = q.where(Course.slug == course_slug)
    if lesson_id:
        q = q.where(Lesson.id == lesson_id)

    rows = (await db.execute(q)).all()
    out: list[LessonProgressPublic] = []
    for lesson, slug, prog in rows:
        out.append(
            LessonProgressPublic(
                lesson_id=lesson.id,
                course_slug=slug,
                title=lesson.title,
                keys=lesson.keys or [],
                completed=bool(prog and prog.completed),
                attempts=int(prog.attempts or 0) if prog else 0,
                correct_count=int(prog.correct_count or 0) if prog else 0,
                xp_reward=lesson.xp_reward,
            )
        )
    return out


@router.get("/progress/courses", response_model=list[CourseProgressPublic])
async def course_progress(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Per-course completion from existing lesson progress — does not alter courses."""
    courses = (
        await db.scalars(select(Course).order_by(Course.sort_order, Course.title))
    ).all()
    out: list[CourseProgressPublic] = []
    for course in courses:
        lesson_rows = (
            await db.execute(
                select(Lesson.id, Lesson.xp_reward)
                .join(Category, Lesson.category_id == Category.id)
                .where(Category.course_id == course.id)
            )
        ).all()
        lesson_ids = [row[0] for row in lesson_rows]
        lesson_count = len(lesson_ids)
        xp_total = sum(int(row[1] or 0) for row in lesson_rows)
        if not lesson_ids:
            out.append(
                CourseProgressPublic(
                    course_id=course.id,
                    slug=course.slug,
                    title=course.title,
                    icon=course.icon,
                    lesson_count=0,
                    completed_lessons=0,
                    percent=0,
                    xp_earned=0,
                    xp_total=0,
                )
            )
            continue

        completed_rows = (
            await db.execute(
                select(Lesson.id, Lesson.xp_reward)
                .join(UserLessonProgress, UserLessonProgress.lesson_id == Lesson.id)
                .where(
                    UserLessonProgress.user_id == user.id,
                    UserLessonProgress.completed.is_(True),
                    Lesson.id.in_(lesson_ids),
                )
            )
        ).all()
        completed_lessons = len(completed_rows)
        xp_earned = sum(int(row[1] or 0) for row in completed_rows)
        percent = round((completed_lessons / lesson_count) * 100, 1) if lesson_count else 0.0
        out.append(
            CourseProgressPublic(
                course_id=course.id,
                slug=course.slug,
                title=course.title,
                icon=course.icon,
                lesson_count=lesson_count,
                completed_lessons=completed_lessons,
                percent=percent,
                xp_earned=xp_earned,
                xp_total=xp_total,
            )
        )
    return out


@router.get("/stats/me", response_model=StatsPublic)
async def my_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stats = await db.scalar(select(UserStats).where(UserStats.user_id == user.id))
    if not stats:
        stats = UserStats(user_id=user.id)
        db.add(stats)
        await db.commit()
    learned = await db.scalar(
        select(func.count())
        .select_from(UserLessonProgress)
        .where(UserLessonProgress.user_id == user.id, UserLessonProgress.completed.is_(True))
    )
    total = stats.total_correct + stats.total_wrong
    accuracy = (stats.total_correct / total * 100) if total else 0.0
    return StatsPublic(
        total_correct=stats.total_correct,
        total_wrong=stats.total_wrong,
        accuracy=round(accuracy, 1),
        combos_best=stats.combos_best,
        speed_best_score=stats.speed_best_score,
        exam_best_score=stats.exam_best_score,
        study_time_seconds=stats.study_time_seconds,
        streak_days=user.streak_days,
        favorite_course_slug=stats.favorite_course_slug,
        avg_response_ms=stats.avg_response_ms,
        combinations_learned=learned or 0,
    )


@router.get("/daily", response_model=list[DailyChallengePublic])
async def daily_challenges(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await ensure_daily_challenges(user, db)
    await db.commit()
    rows = (
        await db.scalars(
            select(DailyChallenge).where(
                DailyChallenge.user_id == user.id,
                DailyChallenge.challenge_date == date.today(),
            )
        )
    ).all()
    titles = {t[0]: t[1] for t in DAILY_TEMPLATES}
    targets = {t[0]: t[2] for t in DAILY_TEMPLATES}
    return [
        DailyChallengePublic(
            challenge_type=r.challenge_type,
            title=titles.get(r.challenge_type, r.challenge_type),
            target=targets.get(r.challenge_type, r.target),
            progress=r.progress,
            completed=r.completed,
            xp_reward=r.xp_reward,
        )
        for r in rows
    ]


@router.get("/training/random")
async def random_lessons(
    course_slug: str | None = None,
    limit: int = 30,
    browser_safe: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """browser_safe=True excludes Meta/Win/Cmd chords — OS often steals them from the browser."""
    q = (
        select(Lesson, Category.slug, Course.slug)
        .join(Category, Lesson.category_id == Category.id)
        .join(Course, Category.course_id == Course.id)
    )
    if course_slug:
        q = q.where(Course.slug == course_slug)
    rows = list((await db.execute(q)).all())
    if browser_safe:
        rows = [
            row
            for row in rows
            if not any(str(k) in ("Meta", "OS", "Win") for k in (row[0].keys or []))
        ]
    if not rows:
        rows = list((await db.execute(q)).all())
    sample = random.sample(rows, min(limit, len(rows)))
    return [
        {
            "id": str(lesson.id),
            "title": lesson.title,
            "action_prompt": lesson.action_prompt,
            "keys": lesson.keys,
            "course_slug": c_slug,
            "category_slug": cat_slug,
        }
        for lesson, cat_slug, c_slug in sample
    ]
