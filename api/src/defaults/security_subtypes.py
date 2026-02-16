import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Common instrument subtypes mapped to parent security types.
# (subtype_code, subtype_desc, security_type_code, is_active)
DEFAULT_SECURITY_SUBTYPES = [
    ("NOT SPECIFIED", "Not Specified", "NOT SPECIFIED", True),
    ("Equity", "Equity", "Equity", True),
    ("Bond", "Bond", "Bond", True),
    ("Call", "Call", "Option", True),
    ("Put", "Put", "Option", True),
    ("Future", "Future", "Future", True),
    ("Cash", "Cash", "Cash", True),
]


async def insert_default_security_subtypes_for_tenant(session: AsyncSession, tenant_id: uuid.UUID) -> int:
    inserted = 0
    for subtype_code, subtype_desc, type_code, active in DEFAULT_SECURITY_SUBTYPES:
        # Look up the parent security_type_id
        type_result = await session.execute(
            text("SELECT id FROM security_types WHERE security_type_code = :code AND tenant_id = :tid"),
            {"code": type_code, "tid": tenant_id},
        )
        type_row = type_result.fetchone()
        if not type_row:
            continue

        result = await session.execute(
            text("SELECT COUNT(*) FROM security_subtypes WHERE security_subtype_code = :code AND tenant_id = :tid"),
            {"code": subtype_code, "tid": tenant_id},
        )
        if result.scalar() == 0:
            await session.execute(
                text("""
                    INSERT INTO security_subtypes (security_subtype_code, security_subtype_desc, security_type_id, is_active, tenant_id, created_at)
                    VALUES (:code, :desc, :type_id, :active, :tid, NOW())
                """),
                {"code": subtype_code, "desc": subtype_desc, "type_id": type_row[0], "active": active, "tid": tenant_id},
            )
            inserted += 1
    return inserted
