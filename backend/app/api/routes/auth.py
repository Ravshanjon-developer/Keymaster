from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, touch_user_activity
from app.core.passwords import validate_password_strength
from app.core.rate_limit import limit_auth
from app.core.supabase_auth import supabase_configured
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models import User, UserStats
from app.schemas import (
    MessageResponse,
    RegisterResponse,
    Token,
    UserLogin,
    UserPublic,
    UserRegister,
    VerifyEmailResponse,
)
from app.services.email_verification import (
    hash_verification_token,
    new_verification_token,
    send_verification_email,
)

router = APIRouter(prefix="/auth", tags=["auth"])

EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED"


class ResendVerificationBody(BaseModel):
    email: EmailStr


class VerifyEmailBody(BaseModel):
    token: str


async def _assign_verification(user: User) -> None:
    raw, token_hash, expires = new_verification_token()
    user.email_verified = False
    user.email_verification_token = token_hash
    user.email_verification_expires = expires
    await send_verification_email(user.email, raw)


def _require_verified(user: User) -> None:
    if user.is_admin or user.email_verified:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=EMAIL_NOT_VERIFIED,
    )


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserRegister, request: Request, db: AsyncSession = Depends(get_db)):
    if supabase_configured():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use Supabase registration in the app (email confirmation via Supabase).",
        )
    limit_auth(request)
    validate_password_strength(body.password)
    exists = await db.execute(select(User).where((User.email == body.email) | (User.username == body.username)))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or username taken")
    user = User(
        email=body.email.lower().strip(),
        username=body.username,
        hashed_password=get_password_hash(body.password),
        display_name=body.display_name,
        is_admin=False,
        email_verified=False,
    )
    db.add(user)
    await db.flush()
    db.add(UserStats(user_id=user.id))
    try:
        await _assign_verification(user)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Не удалось отправить письмо подтверждения. Попробуйте позже.",
        ) from exc
    await db.commit()
    return RegisterResponse(
        message="На ваш email отправлена ссылка для подтверждения. Войти можно после подтверждения.",
        email=user.email,
    )


@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(body: VerifyEmailBody, db: AsyncSession = Depends(get_db)):
    token = (body.token or "").strip()
    if len(token) < 16:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
    token_hash = hash_verification_token(token)
    result = await db.execute(select(User).where(User.email_verification_token == token_hash))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired link")
    expires = user.email_verification_expires
    now = datetime.now(UTC)
    if not expires:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired link")
    exp = expires if expires.tzinfo else expires.replace(tzinfo=UTC)
    if exp < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired link")
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires = None
    await db.commit()
    return VerifyEmailResponse(message="Email подтверждён. Теперь можно войти.")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    body: ResendVerificationBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    limit_auth(request)
    email = body.email.lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    generic = MessageResponse(
        message="Если аккаунт существует и email не подтверждён, мы отправили новое письмо.",
    )
    if not user or user.email_verified or user.is_admin:
        return generic
    try:
        await _assign_verification(user)
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Не удалось отправить письмо. Попробуйте позже.",
        )
    return generic


@router.post("/login/json", response_model=Token)
async def login_json(body: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    limit_auth(request)
    result = await db.execute(select(User).where(User.email == body.email.lower().strip()))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")
    _require_verified(user)
    await touch_user_activity(user)
    await db.commit()
    return Token(access_token=create_access_token(user.id))


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    limit_auth(request)
    result = await db.execute(select(User).where(User.email == form.username.lower().strip()))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")
    _require_verified(user)
    await touch_user_activity(user)
    await db.commit()
    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserPublic)
async def me(user: User = Depends(get_current_user)):
    return user


@router.post("/google")
async def google_oauth_placeholder():
    """Reserved for Google OAuth — configure GOOGLE_CLIENT_ID in settings."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Google OAuth will be enabled when credentials are configured",
    )
