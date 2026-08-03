"""Simple in-memory sliding-window rate limiter (per process)."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from app.core.config import settings


_hits: dict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def check_rate_limit(request: Request, *, bucket: str, limit: int, window_sec: int = 60) -> None:
    if limit <= 0:
        return
    key = f"{bucket}:{_client_ip(request)}"
    now = time.monotonic()
    q = _hits[key]
    while q and now - q[0] > window_sec:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Try again later.",
        )
    q.append(now)


def limit_auth(request: Request) -> None:
    check_rate_limit(request, bucket="auth", limit=settings.rate_limit_auth_per_minute)


def limit_admin(request: Request) -> None:
    check_rate_limit(request, bucket="admin", limit=settings.rate_limit_admin_per_minute)
