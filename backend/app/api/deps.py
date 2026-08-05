import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.core.supabase_auth import decode_supabase_payload
from app.db.session import get_db
from app.models import User
from app.services.supabase_users import ensure_user_from_supabase

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    sb_payload = decode_supabase_payload(token)
    if sb_payload:
        user = await ensure_user_from_supabase(db, sb_payload)
        if not user.email_verified and not user.is_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="EMAIL_NOT_VERIFIED")
        await db.commit()
        return user

    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    try:
        uid = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_admin and not user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="EMAIL_NOT_VERIFIED")
    return user


async def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user


async def touch_user_activity(user: User) -> None:
    from datetime import date

    today = date.today()
    if user.last_active_date == today:
        return
    if user.last_active_date and (today - user.last_active_date).days == 1:
        user.streak_days += 1
    else:
        user.streak_days = 1
    user.last_active_date = today
