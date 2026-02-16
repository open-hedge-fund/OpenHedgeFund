import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Standard market classification tiers used across the financial industry
DEFAULT_MARKET_CATEGORIES = [
    ("NOT SPECIFIED", "Not Specified", True),
    ("Developed", "Developed Markets", True),
    ("Emerging", "Emerging Markets", True),
    ("Frontier", "Frontier Markets", True),
]


async def insert_default_market_categories_for_tenant(session: AsyncSession, tenant_id: uuid.UUID) -> int:
    inserted = 0
    for code, desc, active in DEFAULT_MARKET_CATEGORIES:
        result = await session.execute(
            text("SELECT COUNT(*) FROM market_categories WHERE market_category_code = :code AND tenant_id = :tid"),
            {"code": code, "tid": tenant_id},
        )
        if result.scalar() == 0:
            await session.execute(
                text("""
                    INSERT INTO market_categories (market_category_code, market_category_desc, is_active, tenant_id, created_at)
                    VALUES (:code, :desc, :active, :tid, NOW())
                """),
                {"code": code, "desc": desc, "active": active, "tid": tenant_id},
            )
            inserted += 1
    return inserted
