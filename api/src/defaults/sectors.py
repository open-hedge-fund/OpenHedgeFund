import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Standard sector classifications used across the financial industry
DEFAULT_SECTORS = [
    ("MISC", "Miscellaneous", True),
    ("MAT", "Basic Materials", True),
    ("COMM", "Communications", True),
    ("CONCY", "Consumer, Cyclical", True),
    ("CONNC", "Consumer, Non-cyclical", True),
    ("DIV", "Diversified", True),
    ("ENR", "Energy", True),
    ("FIN", "Financial", True),
    ("FND", "Funds", True),
    ("GOV", "Government", True),
    ("IND", "Industrial", True),
    ("TECH", "Technology", True),
    ("UTL", "Utilities", True),
]


async def insert_default_sectors_for_tenant(session: AsyncSession, tenant_id: uuid.UUID) -> int:
    inserted = 0
    for code, desc, active in DEFAULT_SECTORS:
        result = await session.execute(
            text("SELECT COUNT(*) FROM sectors WHERE sector_code = :code AND tenant_id = :tid"),
            {"code": code, "tid": tenant_id},
        )
        if result.scalar() == 0:
            await session.execute(
                text("""
                    INSERT INTO sectors (sector_code, sector_desc, is_active, tenant_id, created_at)
                    VALUES (:code, :desc, :active, :tid, NOW())
                """),
                {"code": code, "desc": desc, "active": active, "tid": tenant_id},
            )
            inserted += 1
    return inserted
