import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# (file_name, column_name, table_mapping, column_mapping)
DEFAULT_COLUMN_DEFINITIONS = [
    ("SOD (Start of Day)", "Date", "holdings", "holding_date"),
    ("SOD (Start of Day)", "Custodian_ID", "custodians", "account_number"),
    ("SOD (Start of Day)", "Symbol", "securities", "symbol"),
    ("SOD (Start of Day)", "Issuing Country", "countries", "country_code"),
    ("SOD (Start of Day)", "Local Currency", "currencies", "ccy"),
    ("SOD (Start of Day)", "Asset Class", "asset_types", "asset_type_code"),
    ("SOD (Start of Day)", "L/S", "holdings", "side"),
    ("SOD (Start of Day)", "Quantity", "holdings", "quantity_start"),
    ("SOD (Start of Day)", "Cost (Local Ccy)", "holdings", "cost_local"),
    ("SOD (Start of Day)", "Cost", "holdings", "cost_base"),
    ("SOD (Start of Day)", "Outstanding Shares", "holdings", "outstanding_shares"),
    ("SOD (Start of Day)", "SEDOL", "securities", "id_1"),
    ("SOD (Start of Day)", "ISIN", "securities", "id_2"),
    ("SOD (Start of Day)", "CUSIP", "securities", "id_3"),
]


async def insert_default_column_definitions_for_tenant(
    session: AsyncSession, tenant_id: uuid.UUID
) -> int:
    inserted = 0
    for file_name, column_name, table_mapping, column_mapping in DEFAULT_COLUMN_DEFINITIONS:
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
                        (file_id, column_name, table_mapping, column_mapping, tenant_id, created_at)
                    VALUES (:fid, :col, :tmap, :cmap, :tid, NOW())
                """),
                {
                    "fid": file_id,
                    "col": column_name,
                    "tmap": table_mapping,
                    "cmap": column_mapping,
                    "tid": tenant_id,
                },
            )
            inserted += 1
    return inserted
