import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

DEFAULT_SECURITY_TYPES = [
    ("NOT SPECIFIED", "Not Specified", None, True),
    ("Equity", "Equity", None, True),
    ("Bond", "Bond", None, True),
    ("Option", "Option", None, True),
    ("Future", "Future", None, True),
    ("CreditDefaultInstrument", "Credit Default Instrument", None, True),
    ("Swap", "Swap", None, True),
    ("ForwardFxContract", "Forward FX Contract", None, True),
    ("Cash", "Cash", None, True),
]


async def insert_default_security_types_for_tenant(session: AsyncSession, tenant_id: uuid.UUID) -> int:
    inserted = 0
    for code, desc, settlement_days, active in DEFAULT_SECURITY_TYPES:
        result = await session.execute(
            text("SELECT COUNT(*) FROM security_types WHERE security_type_code = :code AND tenant_id = :tid"),
            {"code": code, "tid": tenant_id},
        )
        if result.scalar() == 0:
            await session.execute(
                text("""
                    INSERT INTO security_types (security_type_code, security_type_desc, settlement_days, is_active, tenant_id, created_at)
                    VALUES (:code, :desc, :days, :active, :tid, NOW())
                """),
                {"code": code, "desc": desc, "days": settlement_days, "active": active, "tid": tenant_id},
            )
            inserted += 1
    return inserted
