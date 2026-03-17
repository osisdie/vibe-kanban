"""
Standalone migration runner — executes all SQL files in migrations/ before the app starts.

Usage: python migrate.py
Called automatically by Docker CMD before gunicorn.

Each .sql file must be idempotent (use IF NOT EXISTS, IF EXISTS, etc.)
so re-running is always safe. Files are executed in alphabetical order.
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("migrate")

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


async def run_migrations():
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url.startswith("postgresql"):
        logger.info("Skipping migrations (not PostgreSQL)")
        return

    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import create_async_engine

    engine = create_async_engine(db_url)

    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not sql_files:
        logger.info("No migration files found")
        await engine.dispose()
        return

    async with engine.begin() as conn:
        for f in sql_files:
            sql = f.read_text().strip()
            if not sql:
                continue
            logger.info("Applying %s", f.name)
            for statement in sql.split(";"):
                statement = statement.strip()
                if statement:
                    await conn.execute(text(statement))

    await engine.dispose()
    logger.info("All migrations applied (%d files)", len(sql_files))


if __name__ == "__main__":
    try:
        asyncio.run(run_migrations())
    except Exception:
        logger.exception("Migration failed")
        sys.exit(1)
