import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# (file_name, column_name, mapping)
DEFAULT_COLUMN_DEFINITIONS = [
    ("SOD (Start of Day)", "Date", "holding_date"),
    ("SOD (Start of Day)", "Custodian_ID", "account_number"),
    ("SOD (Start of Day)", "Symbol", "symbol"),
    ("SOD (Start of Day)", "Issuing Country", "country_code"),
    ("SOD (Start of Day)", "Local Currency", "ccy"),
    ("SOD (Start of Day)", "Asset Class", "asset_type_code"),
    ("SOD (Start of Day)", "L/S", "side"),
    ("SOD (Start of Day)", "Quantity", "quantity_start"),
    ("SOD (Start of Day)", "Cost (Local Ccy)", "cost_local"),
    ("SOD (Start of Day)", "Cost", "cost_base"),
    ("SOD (Start of Day)", "Outstanding Shares", "outstanding_shares"),
    ("SOD (Start of Day)", "SEDOL", "id_1"),
    ("SOD (Start of Day)", "ISIN", "id_2"),
    ("SOD (Start of Day)", "CUSIP", "id_3"),
]


async def insert_default_column_definitions_for_tenant(
    session: AsyncSession, tenant_id: uuid.UUID
) -> int:
    inserted = 0
    for file_name, column_name, mapping in DEFAULT_COLUMN_DEFINITIONS:
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
                    INSERT INTO column_definitions (file_id, column_name, mapping, tenant_id, created_at)
                    VALUES (:fid, :col, :mapping, :tid, NOW())
                """),
                {"fid": file_id, "col": column_name, "mapping": mapping, "tid": tenant_id},
            )
            inserted += 1
    return inserted
