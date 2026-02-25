import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# (file_name, column_name, table_mapping, column_mapping, validate_against)
DEFAULT_COLUMN_DEFINITIONS = [
    ("SOD (Start of Day)", "Date", "holdings", "holding_date", None),
    ("SOD (Start of Day)", "Custodian_ID", "holdings", "account_number", "custodians"),
    ("SOD (Start of Day)", "Symbol", "holdings", "symbol", None),
    ("SOD (Start of Day)", "Issuing Country", "holdings", "country_code", "countries"),
    ("SOD (Start of Day)", "Local Currency", "holdings", "ccy", "currencies"),
    ("SOD (Start of Day)", "Asset Class", "holdings", "asset_type_code", "asset_types"),
    ("SOD (Start of Day)", "L/S", "holdings", "side", None),
    ("SOD (Start of Day)", "Quantity", "holdings", "quantity_start", None),
    ("SOD (Start of Day)", "Cost (Local Ccy)", "holdings", "cost_local", None),
    ("SOD (Start of Day)", "Cost", "holdings", "cost_base", None),
    ("SOD (Start of Day)", "Outstanding Shares", "holdings", "outstanding_shares", None),
    ("SOD (Start of Day)", "Security Description", "holdings", "security_des", None),
    ("SOD (Start of Day)", "SEDOL", "holdings", "id_1", None),
    ("SOD (Start of Day)", "ISIN", "holdings", "id_2", None),
    ("SOD (Start of Day)", "CUSIP", "holdings", "id_3", None),
]


async def insert_default_column_definitions_for_tenant(
    session: AsyncSession, tenant_id: uuid.UUID
) -> int:
    inserted = 0
    for file_name, column_name, table_mapping, column_mapping, validate_against in DEFAULT_COLUMN_DEFINITIONS:
        # Look up the file_id by name and tenant
        result = await session.execute(
            text("SELECT id FROM files WHERE name = :name AND tenant_id = :tid"),
            {"name": file_name, "tid": tenant_id},
        )
        row = result.fetchone()
        if not row:
            continue
        file_id = row.id

        # Check if this column definition already exists
        result = await session.execute(
            text("""
                SELECT COUNT(*) FROM column_definitions
                WHERE file_id = :fid AND column_name = :col AND tenant_id = :tid
            """),
            {"fid": file_id, "col": column_name, "tid": tenant_id},
        )
        if result.scalar() == 0:
            await session.execute(
                text("""
                    INSERT INTO column_definitions
                        (file_id, column_name, table_mapping, column_mapping,
                         validate_against, tenant_id, created_at)
                    VALUES (:fid, :col, :tmap, :cmap, :va, :tid, NOW())
                """),
                {
                    "fid": file_id,
                    "col": column_name,
                    "tmap": table_mapping,
                    "cmap": column_mapping,
                    "va": validate_against,
                    "tid": tenant_id,
                },
            )
            inserted += 1
    return inserted
