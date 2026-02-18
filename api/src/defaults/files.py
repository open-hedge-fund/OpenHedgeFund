import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

DEFAULT_FILES = [
    ("SOD (Start of Day)", "CSV", True),
]


async def insert_default_files_for_tenant(session: AsyncSession, tenant_id: uuid.UUID) -> int:
    inserted = 0
    for name, file_type, active in DEFAULT_FILES:
        result = await session.execute(
            text("SELECT COUNT(*) FROM files WHERE name = :name AND tenant_id = :tid"),
            {"name": name, "tid": tenant_id},
        )
        if result.scalar() == 0:
            await session.execute(
                text("""
                    INSERT INTO files (name, type, is_active, tenant_id, created_at)
                    VALUES (:name, :type, :active, :tid, NOW())
                """),
                {"name": name, "type": file_type, "active": active, "tid": tenant_id},
            )
            inserted += 1
    return inserted
