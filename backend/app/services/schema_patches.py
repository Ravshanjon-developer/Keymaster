import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

logger = logging.getLogger("keymaster")


async def _patch_sqlite(conn: AsyncConnection, ddl: str) -> None:
    try:
        await conn.execute(text(ddl))
    except Exception as exc:
        if "duplicate column" not in str(exc).lower():
            logger.warning("schema patch skipped: %s", exc)


async def apply_schema_patches(conn: AsyncConnection) -> None:
    """Idempotent column adds for databases created before model updates."""
    dialect = conn.dialect.name

    if dialect == "postgresql":
        await conn.execute(
            text(
                "ALTER TABLE user_lesson_progress "
                "ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified "
                "BOOLEAN NOT NULL DEFAULT true"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token "
                "VARCHAR(128)"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires "
                "TIMESTAMPTZ"
            )
        )
        return

    if dialect == "sqlite":
        await _patch_sqlite(
            conn,
            "ALTER TABLE user_lesson_progress ADD COLUMN completed_at DATETIME",
        )
        await _patch_sqlite(
            conn,
            "ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT 1",
        )
        await _patch_sqlite(
            conn,
            "ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(128)",
        )
        await _patch_sqlite(
            conn,
            "ALTER TABLE users ADD COLUMN email_verification_expires DATETIME",
        )
        return

    logger.info("schema patches: no-op for dialect %s", dialect)
