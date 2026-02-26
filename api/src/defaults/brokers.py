import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Default brokers available to every tenant
DEFAULT_BROKERS = [
    ("JPM", "JP Morgan"),
    ("CITI", "Citibank"),
]


async def insert_default_brokers_for_tenant(session: AsyncSession, tenant_id: uuid.UUID) -> int:
    inserted = 0
    for code, desc in DEFAULT_BROKERS:
        result = await session.execute(
            text("SELECT COUNT(*) FROM brokers WHERE broker_code = :code AND tenant_id = :tid"),
            {"code": code, "tid": tenant_id},
        )
        if result.scalar() == 0:
            await session.execute(
                text("""
                    INSERT INTO brokers (broker_code, broker_description, tenant_id, created_at)
                    VALUES (:code, :desc, :tid, NOW())
                """),
                {"code": code, "desc": desc, "tid": tenant_id},
            )
            inserted += 1
    return inserted
