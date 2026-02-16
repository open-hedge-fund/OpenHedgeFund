import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Based on ISO 10962 (CFI - Classification of Financial Instruments)
# Simplified subset for initial setup; can be extended as needed.
DEFAULT_ASSET_TYPES = [
    ("NOT SPECIFIED", "Not Specified", True),
    ("CASH", "Cash and Equivalents", True),
    ("EQUITY", "Equity", True),
    ("OPTIONS", "Options", True),
]


async def insert_default_asset_types_for_tenant(session: AsyncSession, tenant_id: uuid.UUID) -> int:
    inserted = 0
    for code, desc, active in DEFAULT_ASSET_TYPES:
        result = await session.execute(
            text("SELECT COUNT(*) FROM asset_types WHERE asset_type_code = :code AND tenant_id = :tid"),
            {"code": code, "tid": tenant_id},
        )
        if result.scalar() == 0:
            await session.execute(
                text("""
                    INSERT INTO asset_types (asset_type_code, asset_type_desc, is_active, tenant_id, created_at)
                    VALUES (:code, :desc, :active, :tid, NOW())
                """),
                {"code": code, "desc": desc, "active": active, "tid": tenant_id},
            )
            inserted += 1
    return inserted
