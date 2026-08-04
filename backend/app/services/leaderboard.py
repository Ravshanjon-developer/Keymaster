import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Achievement, Lesson, User, UserAchievement, UserLessonProgress
from app.services.levels import level_from_xp


def period_cutoff(period: str) -> datetime | None:
    now = datetime.now(UTC)
    if period == "week":
        return now - timedelta(days=7)
    if period == "month":
        return now - timedelta(days=30)
    return None


async def leaderboard_rows(
    db: AsyncSession,
    *,
    period: str = "all",
    limit: int = 50,
) -> list[tuple[User, int]]:
    """Return (user, xp_for_period) ordered by xp desc."""
    if period == "all":
        users = (
            await db.scalars(
                select(User)
                .where(User.is_admin.is_(False))
                .order_by(User.xp.desc())
                .limit(limit)
            )
        ).all()
        return [(u, int(u.xp or 0)) for u in users]

    cutoff = period_cutoff(period)
    if cutoff is None:
        users = (
            await db.scalars(
                select(User)
                .where(User.is_admin.is_(False))
                .order_by(User.xp.desc())
                .limit(limit)
            )
        ).all()
        return [(u, int(u.xp or 0)) for u in users]

    lesson_xp = (
        select(
            UserLessonProgress.user_id.label("user_id"),
            func.coalesce(func.sum(Lesson.xp_reward), 0).label("xp"),
        )
        .join(Lesson, Lesson.id == UserLessonProgress.lesson_id)
        .where(
            UserLessonProgress.completed.is_(True),
            UserLessonProgress.completed_at.is_not(None),
            UserLessonProgress.completed_at >= cutoff,
        )
        .group_by(UserLessonProgress.user_id)
        .subquery()
    )

    ach_xp = (
        select(
            UserAchievement.user_id.label("user_id"),
            func.coalesce(func.sum(Achievement.xp_bonus), 0).label("xp"),
        )
        .join(Achievement, Achievement.id == UserAchievement.achievement_id)
        .where(UserAchievement.unlocked_at >= cutoff)
        .group_by(UserAchievement.user_id)
        .subquery()
    )

    period_xp = (
        func.coalesce(lesson_xp.c.xp, 0) + func.coalesce(ach_xp.c.xp, 0)
    ).label("period_xp")

    q = (
        select(User, period_xp)
        .outerjoin(lesson_xp, lesson_xp.c.user_id == User.id)
        .outerjoin(ach_xp, ach_xp.c.user_id == User.id)
        .where(User.is_admin.is_(False))
        .order_by(period_xp.desc(), User.username.asc())
        .limit(limit)
    )
    rows = (await db.execute(q)).all()
    out: list[tuple[User, int]] = []
    for user, xp in rows:
        xp_int = int(xp or 0)
        if xp_int <= 0:
            continue
        out.append((user, xp_int))
    return out


async def user_period_xp(db: AsyncSession, user_id: uuid.UUID, period: str) -> int:
    if period == "all":
        user = await db.get(User, user_id)
        return int(user.xp or 0) if user else 0

    cutoff = period_cutoff(period)
    if cutoff is None:
        user = await db.get(User, user_id)
        return int(user.xp or 0) if user else 0

    lesson_sum = await db.scalar(
        select(func.coalesce(func.sum(Lesson.xp_reward), 0))
        .select_from(UserLessonProgress)
        .join(Lesson, Lesson.id == UserLessonProgress.lesson_id)
        .where(
            UserLessonProgress.user_id == user_id,
            UserLessonProgress.completed.is_(True),
            UserLessonProgress.completed_at.is_not(None),
            UserLessonProgress.completed_at >= cutoff,
        )
    )
    ach_sum = await db.scalar(
        select(func.coalesce(func.sum(Achievement.xp_bonus), 0))
        .select_from(UserAchievement)
        .join(Achievement, Achievement.id == UserAchievement.achievement_id)
        .where(
            UserAchievement.user_id == user_id,
            UserAchievement.unlocked_at >= cutoff,
        )
    )
    return int(lesson_sum or 0) + int(ach_sum or 0)


async def rank_for_user(db: AsyncSession, user: User, period: str) -> int:
    if user.is_admin:
        return 0
    xp = await user_period_xp(db, user.id, period)
    if period != "all" and xp <= 0:
        return 0
    if period == "all":
        higher = await db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.is_admin.is_(False), User.xp > xp)
        )
        return int(higher or 0) + 1

    rows = await leaderboard_rows(db, period=period, limit=10_000)
    for i, (u, _row_xp) in enumerate(rows, start=1):
        if u.id == user.id:
            return i
    return 0
