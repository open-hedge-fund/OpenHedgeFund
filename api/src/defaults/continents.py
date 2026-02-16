import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Based on the UN geoscheme (M49) standard
# https://unstats.un.org/unsd/methodology/m49/
DEFAULT_CONTINENTS = [
    ("NOT SPECIFIED", "Not Specified", True),
    ("Africa", "Africa", True),
    ("Americas", "Americas", True),
    ("Antarctica", "Antarctica", True),
    ("Asia", "Asia", True),
    ("Europe", "Europe", True),
    ("Oceania", "Oceania", True),
]


async def insert_default_continents_for_tenant(session: AsyncSession, tenant_id: uuid.UUID) -> int:
    inserted = 0
    for code, desc, active in DEFAULT_CONTINENTS:
        result = await session.execute(
            text("SELECT COUNT(*) FROM continents WHERE continent_code = :code AND tenant_id = :tid"),
            {"code": code, "tid": tenant_id},
        )
        if result.scalar() == 0:
            await session.execute(
                text("""
                    INSERT INTO continents (continent_code, continent_desc, is_active, tenant_id, created_at)
                    VALUES (:code, :desc, :active, :tid, NOW())
                """),
                {"code": code, "desc": desc, "active": active, "tid": tenant_id},
            )
            inserted += 1
    return inserted
