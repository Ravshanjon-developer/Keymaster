from jose import JWTError, jwt

from app.core.config import settings


def supabase_configured() -> bool:
    return bool(settings.supabase_jwt_secret)


def decode_supabase_payload(token: str) -> dict | None:
    secret = settings.supabase_jwt_secret
    if not secret:
        return None
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
        if payload.get("sub"):
            return payload
    except JWTError:
        return None
    return None
