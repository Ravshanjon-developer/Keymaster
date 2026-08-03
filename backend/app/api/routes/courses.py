from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models import Category, Course, Lesson
from app.schemas import CourseDetail, CoursePublic, LessonPublic

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=list[CoursePublic])
async def list_courses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).order_by(Course.sort_order))
    courses = result.scalars().all()
    out: list[CoursePublic] = []
    for c in courses:
        cat_count = await db.scalar(
            select(func.count()).select_from(Category).where(Category.course_id == c.id)
        )
        lesson_count = await db.scalar(
            select(func.count())
            .select_from(Lesson)
            .join(Category)
            .where(Category.course_id == c.id)
        )
        out.append(
            CoursePublic(
                id=c.id,
                slug=c.slug,
                title=c.title,
                description=c.description,
                icon=c.icon,
                sort_order=c.sort_order,
                lesson_count=lesson_count or 0,
                category_count=cat_count or 0,
            )
        )
    return out


@router.get("/{slug}", response_model=CourseDetail)
async def get_course(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Course)
        .where(Course.slug == slug)
        .options(selectinload(Course.categories).selectinload(Category.lessons))
    )
    course = result.scalar_one_or_none()
    if not course:
        from fastapi import HTTPException

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
            {
                "id": cat.id,
                "slug": cat.slug,
                "title": cat.title,
                "sort_order": cat.sort_order,
                "lessons": [
                    LessonPublic(
                        id=l.id,
                        title=l.title,
                        description=l.description,
                        action_prompt=l.action_prompt,
                        keys=l.keys or [],
                        usage_example=l.usage_example,
                        xp_reward=l.xp_reward,
                        sort_order=l.sort_order,
                        course_slug=course.slug,
                        category_slug=cat.slug,
                    )
                    for l in sorted(cat.lessons, key=lambda x: x.sort_order)
                ],
            }
            for cat in sorted(course.categories, key=lambda x: x.sort_order)
        ],
    )


@router.get("/lessons/{lesson_id}", response_model=LessonPublic)
async def get_lesson(lesson_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Lesson, Category.slug, Course.slug)
        .join(Category, Lesson.category_id == Category.id)
        .join(Course, Category.course_id == Course.id)
        .where(Lesson.id == lesson_id)
    )
    row = result.one_or_none()
    if not row:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Lesson not found")
    lesson, category_slug, course_slug = row
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
