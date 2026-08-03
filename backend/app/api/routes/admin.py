from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin
from app.core.rate_limit import limit_admin
from app.db.session import get_db
from app.models import Achievement, Category, Course, Lesson, User, UserLessonProgress
from app.schemas import (
    AchievementAdmin,
    AdminAchievementCreate,
    AdminAchievementUpdate,
    AdminCategoryCreate,
    AdminCategoryUpdate,
    AdminCourseCreate,
    AdminCourseUpdate,
    AdminLessonCreate,
    AdminLessonUpdate,
    AdminOverview,
    AdminUserUpdate,
    CategoryPublic,
    CourseDetail,
    CoursePublic,
    LessonPublic,
    UserPublic,
)

async def _admin_rate_limit(request: Request) -> None:
    limit_admin(request)


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(_admin_rate_limit)])


def _course_public(course: Course, lesson_count: int = 0, category_count: int = 0) -> CoursePublic:
    return CoursePublic(
        id=course.id,
        slug=course.slug,
        title=course.title,
        description=course.description,
        icon=course.icon,
        sort_order=course.sort_order,
        lesson_count=lesson_count,
        category_count=category_count,
    )


def _lesson_public(lesson: Lesson, course_slug: str | None = None, category_slug: str | None = None) -> LessonPublic:
    return LessonPublic(
        id=lesson.id,
        title=lesson.title,
        description=lesson.description,
        action_prompt=lesson.action_prompt,
        keys=lesson.keys or [],
        usage_example=lesson.usage_example,
        xp_reward=lesson.xp_reward,
        sort_order=lesson.sort_order,
        course_slug=course_slug,
        category_slug=category_slug,
    )


@router.get("/overview", response_model=AdminOverview)
async def overview(_: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    users = await db.scalar(select(func.count()).select_from(User)) or 0
    courses = await db.scalar(select(func.count()).select_from(Course)) or 0
    lessons = await db.scalar(select(func.count()).select_from(Lesson)) or 0
    achievements = await db.scalar(select(func.count()).select_from(Achievement)) or 0
    completed = (
        await db.scalar(
            select(func.count()).select_from(UserLessonProgress).where(UserLessonProgress.completed.is_(True))
        )
        or 0
    )
    admins = await db.scalar(select(func.count()).select_from(User).where(User.is_admin.is_(True))) or 0
    return AdminOverview(
        users=users,
        courses=courses,
        lessons=lessons,
        achievements=achievements,
        lessons_completed=completed,
        admins=admins,
    )


@router.get("/courses", response_model=list[CoursePublic])
async def admin_list_courses(_: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).order_by(Course.sort_order, Course.title))
    courses = result.scalars().all()
    out: list[CoursePublic] = []
    for c in courses:
        cat_count = await db.scalar(select(func.count()).select_from(Category).where(Category.course_id == c.id)) or 0
        lesson_count = (
            await db.scalar(
                select(func.count())
                .select_from(Lesson)
                .join(Category)
                .where(Category.course_id == c.id)
            )
            or 0
        )
        out.append(_course_public(c, lesson_count=lesson_count, category_count=cat_count))
    return out


@router.get("/courses/{course_id}", response_model=CourseDetail)
async def admin_get_course(
    course_id: UUID,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Course)
        .where(Course.id == course_id)
        .options(selectinload(Course.categories).selectinload(Category.lessons))
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    lesson_count = sum(len(cat.lessons) for cat in course.categories)
    return CourseDetail(
        id=course.id,
        slug=course.slug,
        title=course.title,
        description=course.description,
        icon=course.icon,
        sort_order=course.sort_order,
        lesson_count=lesson_count,
        category_count=len(course.categories),
        categories=[
            CategoryPublic(
                id=cat.id,
                slug=cat.slug,
                title=cat.title,
                sort_order=cat.sort_order,
                lessons=[
                    _lesson_public(l, course.slug, cat.slug)
                    for l in sorted(cat.lessons, key=lambda x: x.sort_order)
                ],
            )
            for cat in sorted(course.categories, key=lambda x: x.sort_order)
        ],
    )


@router.post("/courses", response_model=CoursePublic)
async def create_course(
    body: AdminCourseCreate,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    exists = await db.scalar(select(Course).where(Course.slug == body.slug))
    if exists:
        raise HTTPException(status_code=400, detail="Course slug already exists")
    course = Course(**body.model_dump())
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return _course_public(course)


@router.patch("/courses/{course_id}", response_model=CoursePublic)
async def update_course(
    course_id: UUID,
    body: AdminCourseUpdate,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    data = body.model_dump(exclude_unset=True)
    if "slug" in data and data["slug"] != course.slug:
        clash = await db.scalar(select(Course).where(Course.slug == data["slug"]))
        if clash:
            raise HTTPException(status_code=400, detail="Course slug already exists")
    for key, value in data.items():
        setattr(course, key, value)
    await db.commit()
    await db.refresh(course)
    return _course_public(course)


@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: UUID,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.delete(course)
    await db.commit()
    return {"ok": True}


@router.post("/categories", response_model=CategoryPublic)
async def create_category(
    body: AdminCategoryCreate,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, body.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    cat = Category(
        course_id=body.course_id,
        slug=body.slug,
        title=body.title,
        sort_order=body.sort_order,
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return CategoryPublic(id=cat.id, slug=cat.slug, title=cat.title, sort_order=cat.sort_order, lessons=[])


@router.patch("/categories/{category_id}", response_model=CategoryPublic)
async def update_category(
    category_id: UUID,
    body: AdminCategoryUpdate,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    cat = await db.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(cat, key, value)
    await db.commit()
    await db.refresh(cat)
    return CategoryPublic(id=cat.id, slug=cat.slug, title=cat.title, sort_order=cat.sort_order, lessons=[])


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: UUID,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    cat = await db.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(cat)
    await db.commit()
    return {"ok": True}


@router.post("/lessons", response_model=LessonPublic)
async def create_lesson(
    body: AdminLessonCreate,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    cat = await db.get(Category, body.category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    lesson = Lesson(**body.model_dump())
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    course = await db.get(Course, cat.course_id)
    return _lesson_public(lesson, course.slug if course else None, cat.slug)


@router.patch("/lessons/{lesson_id}", response_model=LessonPublic)
async def update_lesson(
    lesson_id: UUID,
    body: AdminLessonUpdate,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(lesson, key, value)
    await db.commit()
    await db.refresh(lesson)
    cat = await db.get(Category, lesson.category_id)
    course = await db.get(Course, cat.course_id) if cat else None
    return _lesson_public(lesson, course.slug if course else None, cat.slug if cat else None)


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(
    lesson_id: UUID,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    await db.delete(lesson)
    await db.commit()
    return {"ok": True}


@router.get("/users", response_model=list[UserPublic])
async def list_users(_: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    users = (await db.scalars(select(User).order_by(User.created_at.desc()))).all()
    return [UserPublic.model_validate(u) for u in users]


@router.patch("/users/{user_id}", response_model=UserPublic)
async def update_user(
    user_id: UUID,
    body: AdminUserUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    data = body.model_dump(exclude_unset=True)
    if "is_admin" in data and user.id == admin.id and data["is_admin"] is False:
        raise HTTPException(status_code=400, detail="Cannot remove your own admin rights")
    for key, value in data.items():
        setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return UserPublic.model_validate(user)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    return {"ok": True}


@router.get("/achievements", response_model=list[AchievementAdmin])
async def list_achievements_admin(_: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    rows = (await db.scalars(select(Achievement).order_by(Achievement.slug))).all()
    return [AchievementAdmin.model_validate(a) for a in rows]


@router.post("/achievements", response_model=AchievementAdmin)
async def create_achievement(
    body: AdminAchievementCreate,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    exists = await db.scalar(select(Achievement).where(Achievement.slug == body.slug))
    if exists:
        raise HTTPException(status_code=400, detail="Achievement slug already exists")
    row = Achievement(**body.model_dump())
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return AchievementAdmin.model_validate(row)


@router.patch("/achievements/{achievement_id}", response_model=AchievementAdmin)
async def update_achievement(
    achievement_id: UUID,
    body: AdminAchievementUpdate,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    row = await db.get(Achievement, achievement_id)
    if not row:
        raise HTTPException(status_code=404, detail="Achievement not found")
    data = body.model_dump(exclude_unset=True)
    if "slug" in data and data["slug"] != row.slug:
        clash = await db.scalar(select(Achievement).where(Achievement.slug == data["slug"]))
        if clash:
            raise HTTPException(status_code=400, detail="Achievement slug already exists")
    for key, value in data.items():
        setattr(row, key, value)
    await db.commit()
    await db.refresh(row)
    return AchievementAdmin.model_validate(row)


@router.delete("/achievements/{achievement_id}")
async def delete_achievement(
    achievement_id: UUID,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    row = await db.get(Achievement, achievement_id)
    if not row:
        raise HTTPException(status_code=404, detail="Achievement not found")
    await db.delete(row)
    await db.commit()
    return {"ok": True}
