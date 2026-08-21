from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Achievement, Category, Course, Lesson
from app.services.seed_data import ACHIEVEMENTS, COURSES

STARTER_SLUGS = frozenset({"computer-basics", "programmer-basics"})
# May rebuild lesson tree when seed fingerprint changes (progress for that course resets once).
CONTENT_REFRESH_SLUGS = frozenset({"computer-basics", "programmer-basics", "windows", "chrome", "vscode"})


def fingerprint_from_seed(course_data: dict) -> str:
    parts: list[str] = [course_data["slug"], course_data["title"]]
    for cat in course_data["categories"]:
        parts.append(cat["slug"])
        parts.append(cat["title"])
        for lesson in cat["lessons"]:
            parts.append(lesson["title"])
            parts.append(lesson["action_prompt"])
            parts.append("+".join(lesson.get("keys") or []))
            parts.append(lesson.get("usage_example") or "")
            parts.append(lesson.get("description") or "")
    return "\n".join(parts)


def fingerprint_from_course(course: Course) -> str:
    cats = sorted(course.categories, key=lambda c: (c.sort_order, c.slug))
    parts: list[str] = [course.slug, course.title]
    for cat in cats:
        parts.append(cat.slug)
        parts.append(cat.title)
        lessons = sorted(cat.lessons, key=lambda lesson: (lesson.sort_order, lesson.title))
        for lesson in lessons:
            parts.append(lesson.title)
            parts.append(lesson.action_prompt)
            parts.append("+".join(lesson.keys or []))
            parts.append(lesson.usage_example or "")
            parts.append(lesson.description or "")
    return "\n".join(parts)


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
                    xp_reward=15 if course_data["slug"] in STARTER_SLUGS else 10,
                    sort_order=lesson_order,
                )
            )
            lesson_order += 1
    return course


async def ensure_catalog(db: AsyncSession) -> None:
    """Add missing courses, refresh metadata/sort; do not wipe existing lesson progress."""
    for i, course_data in enumerate(COURSES):
        existing = await db.scalar(select(Course).where(Course.slug == course_data["slug"]))
        if existing:
            existing.title = course_data["title"]
            existing.description = course_data["description"]
            existing.icon = course_data["icon"]
            existing.sort_order = i
        else:
            await _seed_course(db, course_data, sort_order=i)

    for slug, title, desc, icon, ctype, cval in ACHIEVEMENTS:
        exists = await db.scalar(select(func.count()).select_from(Achievement).where(Achievement.slug == slug))
        if not exists:
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

    for slug in CONTENT_REFRESH_SLUGS:
        course_data = next((c for c in COURSES if c["slug"] == slug), None)
        if not course_data:
            continue
        loaded = await db.execute(
            select(Course)
            .where(Course.slug == slug)
            .options(selectinload(Course.categories).selectinload(Category.lessons))
        )
        existing = loaded.scalar_one_or_none()
        if not existing:
            continue
        if fingerprint_from_course(existing) == fingerprint_from_seed(course_data):
            continue
        await _seed_course(db, course_data, existing.sort_order)

    await db.commit()


async def ensure_programmer_basics(db: AsyncSession) -> None:
    """Backward-compatible alias used by older call sites."""
    await ensure_catalog(db)


async def seed_database(db: AsyncSession) -> None:
    existing = await db.scalar(select(func.count()).select_from(Course))
    if existing and existing > 0:
        await ensure_catalog(db)
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
