import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.routes import admin, auth, courses, progress
from app.core.config import settings
from app.core.security_headers import SecurityHeadersMiddleware
import app.models  # noqa: F401
from app.db.session import AsyncSessionLocal, Base, engine
from app.services.admin_bootstrap import ensure_admin_user
from app.services.schema_patches import apply_schema_patches
from app.services.seed import seed_database

logger = logging.getLogger("keymaster")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables + admin quickly so /health can pass Railway checks.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await apply_schema_patches(conn)
    async with AsyncSessionLocal() as session:
        await ensure_admin_user(session)

    seed_task: asyncio.Task | None = None
    if settings.seed_on_startup:

        async def _seed_bg() -> None:
            try:
                async with AsyncSessionLocal() as session:
                    await seed_database(session)
                logger.info("Database seed completed")
            except Exception:
                logger.exception("Database seed failed")

        seed_task = asyncio.create_task(_seed_bg())

    yield

    if seed_task and not seed_task.done():
        seed_task.cancel()
        try:
            await seed_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="KeyMaster API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

_hosts = settings.trusted_host_list
# Railway public + internal health probes
for extra in ("*.up.railway.app", "healthcheck.railway.app", "localhost", "127.0.0.1"):
    if extra not in _hosts:
        _hosts.append(extra)
if settings.is_production and "*" not in _hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=_hosts)

app.include_router(auth.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.app_env}
