from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, touch_user_activity
from app.core.passwords import validate_password_strength
from app.core.rate_limit import limit_auth
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models import User, UserStats
from app.schemas import Token, UserLogin, UserPublic, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
async def register(body: UserRegister, request: Request, db: AsyncSession = Depends(get_db)):
    limit_auth(request)
    validate_password_strength(body.password)
    exists = await db.execute(select(User).where((User.email == body.email) | (User.username == body.username)))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or username taken")
    user = User(
        email=body.email,
        username=body.username,
        hashed_password=get_password_hash(body.password),
        display_name=body.display_name,
        is_admin=False,
    )
    db.add(user)
    await db.flush()
    db.add(UserStats(user_id=user.id))
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id)
    return Token(access_token=token)


@router.post("/login/json", response_model=Token)
async def login_json(body: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    limit_auth(request)
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")
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
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")
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
