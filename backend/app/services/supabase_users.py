import re

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, UserStats


def _slug_username(base: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9_]", "", base)[:48]
    return s or "user"


async def _unique_username(db: AsyncSession, desired: str, exclude_user_id: int | None = None) -> str:
    base = _slug_username(desired)
    candidate = base[:64]
    n = 0
    while True:
        q = select(func.count()).select_from(User).where(User.username == candidate)
        if exclude_user_id is not None:
            q = q.where(User.id != exclude_user_id)
        exists = await db.scalar(q)
        if not exists:
            return candidate
        n += 1
        suffix = str(n)
        candidate = f"{base[: 64 - len(suffix)]}{suffix}"


async def _sync_profile_from_supabase_meta(db: AsyncSession, user: User, meta: dict) -> None:
    if user.is_admin:
        return
    display_name = meta.get("display_name")
    if display_name and str(display_name).strip():
        user.display_name = str(display_name).strip()[:128]
    else:
        for key in ("full_name", "name"):
            val = meta.get(key)
            if val and str(val).strip():
                user.display_name = str(val).strip()[:128]
                break
    raw_username = meta.get("username")
    if raw_username and str(raw_username).strip():
        desired = _slug_username(str(raw_username).strip())[:64]
        if desired and desired != user.username:
            taken = await db.scalar(
                select(User.id).where(User.username == desired, User.id != user.id)
            )
            user.username = desired if not taken else await _unique_username(db, desired, user.id)


def _supabase_email_confirmed(payload: dict) -> bool:
    if payload.get("email_confirmed_at"):
        return True
    if payload.get("email_verified") is True:
        return True
    app = payload.get("app_metadata") or {}
    if app.get("provider_email_verified") is True or app.get("email_verified") is True:
        return True
    # Supabase access tokens for signed-in users omit email_confirmed_at; role is enough.
    if payload.get("role") == "authenticated":
        return True
    return False


async def ensure_user_from_supabase(db: AsyncSession, payload: dict) -> User:
    sub = str(payload["sub"])
    email = (payload.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    confirmed = _supabase_email_confirmed(payload)
    meta = payload.get("user_metadata") or {}

    def _display_from_meta(m: dict, fallback: str) -> str:
        for key in ("display_name", "full_name", "name"):
            val = m.get(key)
            if val and str(val).strip():
                return str(val).strip()[:128]
        return fallback[:128]

    linked = await db.scalar(
        select(User).where(User.oauth_provider == "supabase", User.oauth_subject == sub)
    )
    if linked:
        linked.email_verified = confirmed or linked.is_admin
        await _sync_profile_from_supabase_meta(db, linked, meta)
        return linked

    by_email = await db.scalar(select(User).where(User.email == email))
    if by_email:
        by_email.oauth_provider = "supabase"
        by_email.oauth_subject = sub
        by_email.email_verified = confirmed or by_email.is_admin or by_email.email_verified
        await _sync_profile_from_supabase_meta(db, by_email, meta)
        return by_email

    username = meta.get("username") or email.split("@")[0]
    username = await _unique_username(db, str(username))
    display_name = _display_from_meta(meta, str(username))

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
