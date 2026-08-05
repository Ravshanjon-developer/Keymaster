import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.passwords import assert_password_strength
from app.core.security import get_password_hash
from app.models import User, UserStats

logger = logging.getLogger("keymaster.admin")


async def ensure_admin_user(db: AsyncSession) -> None:
    """Create or sync admin from env. Never embeds a default password in code."""
    email = (settings.admin_email or "").strip().lower()
    username = (settings.admin_username or "").strip()
    password = settings.admin_password

    if not email or not username or not password:
        if settings.is_production:
            raise RuntimeError("ADMIN_EMAIL, ADMIN_USERNAME and ADMIN_PASSWORD are required")
        logger.warning(
            "Admin bootstrap skipped: set ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD in .env "
            "to create an admin account (no default password is shipped)."
        )
        return

    assert_password_strength(password, admin=True)

    result = await db.execute(
        select(User).where((User.email == email) | (User.username == username))
    )
    user = result.scalars().first()

    if user is None:
        user = User(
            email=email,
            username=username,
            hashed_password=get_password_hash(password),
            display_name=settings.admin_display_name,
            is_admin=True,
            email_verified=True,
            xp=0,
            level=1,
        )
        db.add(user)
        await db.flush()
        db.add(UserStats(user_id=user.id))
        await db.commit()
        logger.info("Admin user created: %s", email)
        return

    changed = False
    if not user.is_admin:
        user.is_admin = True
        changed = True
    if user.email != email:
        user.email = email
        changed = True
    if user.username != username:
        user.username = username
        changed = True
    if settings.admin_sync_password or not user.hashed_password:
        user.hashed_password = get_password_hash(password)
        changed = True
        logger.info("Admin password synced from ADMIN_PASSWORD for %s", email)
    if not user.email_verified:
        user.email_verified = True
        changed = True

    if changed:
        await db.commit()
