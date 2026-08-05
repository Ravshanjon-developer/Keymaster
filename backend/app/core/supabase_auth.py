import json
import time
import urllib.error
import urllib.request

from jose import JWTError, jwt
from jose import jwk as jose_jwk

from app.core.config import settings

_jwks_cache: dict[str, tuple[float, dict]] = {}
_JWKS_TTL_SEC = 3600


def supabase_configured() -> bool:
    return bool(settings.supabase_jwt_secret or settings.supabase_url)


def _configured_jwks_url() -> str | None:
    if not settings.supabase_url:
        return None
    base = settings.supabase_url.rstrip("/")
    return f"{base}/auth/v1/.well-known/jwks.json"


def _resolve_jwks_url(_token: str) -> str | None:
    """JWKS URL from env only — never from unverified JWT claims (SSRF)."""
    return _configured_jwks_url()


def _assert_safe_jwks_url(url: str) -> None:
    expected = _configured_jwks_url()
    if not expected or url.rstrip("/") != expected.rstrip("/"):
        raise ValueError("JWKS URL must match configured Supabase project")


def _fetch_jwks(url: str) -> dict:
    _assert_safe_jwks_url(url)
    now = time.time()
    cached = _jwks_cache.get(url)
    if cached and now - cached[0] < _JWKS_TTL_SEC:
        return cached[1]
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
    _jwks_cache[url] = (now, data)
    return data


def _decode_hs256(token: str) -> dict | None:
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


def _decode_with_jwks(token: str) -> dict | None:
    jwks_url = _resolve_jwks_url(token)
    if not jwks_url:
        return None
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        kid = header.get("kid")
        if alg not in ("ES256", "RS256") or not kid:
            return None
        jwks = _fetch_jwks(jwks_url)
        key_dict = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key_dict:
            return None
        key = jose_jwk.construct(key_dict)
        payload = jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience="authenticated",
            options={"verify_aud": True},
        )
        if payload.get("sub"):
            return payload
    except (JWTError, urllib.error.URLError, TimeoutError, ValueError, KeyError):
        return None
    return None


def decode_supabase_payload(token: str) -> dict | None:
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
    except JWTError:
        return None

    if alg == "HS256":
        payload = _decode_hs256(token)
        if payload:
            return payload
    if alg in ("ES256", "RS256"):
        return _decode_with_jwks(token)

    payload = _decode_hs256(token)
    if payload:
        return payload
    return _decode_with_jwks(token)
