import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

logger = logging.getLogger("keymaster")


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
        return

    if dialect == "sqlite":
        try:
            await conn.execute(
                text("ALTER TABLE user_lesson_progress ADD COLUMN completed_at DATETIME")
            )
        except Exception as exc:
            if "duplicate column" not in str(exc).lower():
                logger.warning("schema patch skipped: %s", exc)
        return

    logger.info("schema patches: no-op for dialect %s", dialect)
