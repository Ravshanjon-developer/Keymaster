import re

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, UserStats


def _slug_username(base: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9_]", "", base)[:48]
    return s or "user"


async def _unique_username(db: AsyncSession, desired: str) -> str:
    base = _slug_username(desired)
    candidate = base[:64]
    n = 0
    while True:
        exists = await db.scalar(select(func.count()).select_from(User).where(User.username == candidate))
        if not exists:
            return candidate
        n += 1
        suffix = str(n)
        candidate = f"{base[: 64 - len(suffix)]}{suffix}"


async def ensure_user_from_supabase(db: AsyncSession, payload: dict) -> User:
    sub = str(payload["sub"])
    email = (payload.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    confirmed = bool(payload.get("email_confirmed_at"))
    meta = payload.get("user_metadata") or {}

    linked = await db.scalar(
        select(User).where(User.oauth_provider == "supabase", User.oauth_subject == sub)
    )
    if linked:
        linked.email_verified = confirmed or linked.is_admin
        return linked

    by_email = await db.scalar(select(User).where(User.email == email))
    if by_email:
        by_email.oauth_provider = "supabase"
        by_email.oauth_subject = sub
        by_email.email_verified = confirmed or by_email.is_admin or by_email.email_verified
        return by_email

    username = meta.get("username") or email.split("@")[0]
    username = await _unique_username(db, str(username))
    display_name = (meta.get("display_name") or username)[:128]

    user = User(
        email=email,
        username=username,
        display_name=display_name,
        hashed_password=None,
        oauth_provider="supabase",
        oauth_subject=sub,
        email_verified=confirmed,
        is_admin=False,
    )
    db.add(user)
    await db.flush()
    db.add(UserStats(user_id=user.id))
    return user
