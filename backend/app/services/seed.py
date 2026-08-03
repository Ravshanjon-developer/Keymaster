from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Achievement, Category, Course, Lesson
from app.services.seed_data import ACHIEVEMENTS, COURSES


async def _seed_course(db: AsyncSession, course_data: dict, sort_order: int) -> Course:
    result = await db.execute(
        select(Course)
        .where(Course.slug == course_data["slug"])
        .options(selectinload(Course.categories).selectinload(Category.lessons))
    )
    course = result.scalar_one_or_none()

    if course:
        course.title = course_data["title"]
        course.description = course_data["description"]
        course.icon = course_data["icon"]
        course.sort_order = sort_order
        # Delete lessons first — ORM would otherwise NULL out category_id (NOT NULL)
        for cat in list(course.categories):
            for lesson in list(cat.lessons):
                await db.delete(lesson)
            await db.delete(cat)
        await db.flush()
    else:
        course = Course(
            slug=course_data["slug"],
            title=course_data["title"],
            description=course_data["description"],
            icon=course_data["icon"],
            sort_order=sort_order,
        )
        db.add(course)
        await db.flush()

    cat_order = 0
    for cat_data in course_data["categories"]:
        category = Category(
            course_id=course.id,
            slug=cat_data["slug"],
            title=cat_data["title"],
            sort_order=cat_order,
        )
        db.add(category)
        await db.flush()
        cat_order += 1
        lesson_order = 0
        for lesson_data in cat_data["lessons"]:
            db.add(
                Lesson(
                    category_id=category.id,
                    title=lesson_data["title"],
                    description=lesson_data.get("description", ""),
                    action_prompt=lesson_data["action_prompt"],
                    keys=lesson_data["keys"],
                    usage_example=lesson_data["usage_example"],
                    xp_reward=15 if course_data["slug"] == "programmer-basics" else 10,
                    sort_order=lesson_order,
                )
            )
            lesson_order += 1
    return course


async def ensure_programmer_basics(db: AsyncSession) -> None:
    """Ensure the mandatory first course exists; do not wipe lessons (keeps XP progress)."""
    basics = next((c for c in COURSES if c["slug"] == "programmer-basics"), None)
    if not basics:
        return

    existing = await db.scalar(select(Course).where(Course.slug == "programmer-basics"))
    if existing:
        existing.title = basics["title"]
        existing.description = basics["description"]
        existing.icon = basics["icon"]
        existing.sort_order = 0
    else:
        await _seed_course(db, basics, sort_order=0)

    others = (
        await db.scalars(select(Course).where(Course.slug != "programmer-basics").order_by(Course.sort_order))
    ).all()
    for i, course in enumerate(others, start=1):
        course.sort_order = i
    exists = await db.scalar(
        select(func.count()).select_from(Achievement).where(Achievement.slug == "basics-complete")
    )
    if not exists:
        db.add(
            Achievement(
                slug="basics-complete",
                title="База программиста",
                description="Пройдите курс «Основные горячие клавиши программиста»",
                icon="graduation-cap",
                condition_type="course_complete",
                condition_value=1,
            )
        )
    await db.commit()


async def seed_database(db: AsyncSession) -> None:
    existing = await db.scalar(select(func.count()).select_from(Course))
    if existing and existing > 0:
        await ensure_programmer_basics(db)
        return

    sort = 0
    for course_data in COURSES:
        await _seed_course(db, course_data, sort)
        sort += 1

    for slug, title, desc, icon, ctype, cval in ACHIEVEMENTS:
        db.add(
            Achievement(
                slug=slug,
                title=title,
                description=desc,
                icon=icon,
                condition_type=ctype,
                condition_value=cval,
            )
        )

    await db.commit()
