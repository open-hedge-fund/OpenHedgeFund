"""Inserts valid DataFrame rows into the holdings table."""

import logging
from decimal import Decimal, InvalidOperation

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.column_mapper import ColumnMapping
from src.jobs.validators.base import ColumnDef

logger = logging.getLogger(__name__)

# column_mapping key → holdings DB column (for fields that go directly into holdings)
HOLDINGS_DIRECT_FIELDS: dict[str, str] = {
    "holding_date": "holding_date",
    "side": "side",
    "quantity_start": "quantity_start",
    "quantity_end": "quantity_end",
    "cost_local": "cost_local",
    "cost_base": "cost_base",
    "price_local": "price_local",
    "price_base": "price_base",
    "outstanding_shares": "outstanding_shares",
    "market_cap": "market_cap",
}

# Resolved FK columns that are copied straight into the row dict.
FK_COLUMNS = {
    "_resolved_security_id": "security_id",
    "_resolved_custodian_id": "custodian_id",
    "_resolved_fund_id": "fund_id",
}


def insert_holdings(
    df: pd.DataFrame,
    col_defs: list[ColumnDef],
    mappings: dict[str, ColumnMapping],
    session: Session,
    tenant_id: str,
) -> int:
    """Insert valid rows into the holdings table. Returns count of inserted rows."""
    has_errors = df["_errors"].apply(len) > 0
    valid_df = df[~has_errors]

    if valid_df.empty:
        return 0

    # Build a lookup: column_mapping key → CSV column name
    key_to_csv: dict[str, str] = {}
    for col_def in col_defs:
        key_to_csv[col_def.column_mapping] = col_def.column_name

    rows: list[dict] = []
    for _, row in valid_df.iterrows():
        record: dict = {"tenant_id": tenant_id}

        # Direct fields
        for mapping_key, holdings_col in HOLDINGS_DIRECT_FIELDS.items():
            csv_col = key_to_csv.get(mapping_key)
            if csv_col is None or csv_col not in df.columns:
                continue

            raw = row.get(csv_col)
            mapping = mappings.get(mapping_key)
            if mapping is None or raw is None:
                continue

            record[holdings_col] = _convert_value(raw, mapping, holdings_col)

        # FK columns
        for resolved_col, holdings_col in FK_COLUMNS.items():
            if resolved_col in row.index and pd.notna(row[resolved_col]):
                record[holdings_col] = int(row[resolved_col])

        rows.append(record)

    if not rows:
        return 0

    # Batch insert
    columns = sorted({col for r in rows for col in r})
    placeholders = ", ".join(f":{col}" for col in columns)
    col_list = ", ".join(columns)

    # Normalise every row dict to have all columns (None for missing).
    normalised = [{col: r.get(col) for col in columns} for r in rows]

    session.execute(
        text(f"INSERT INTO holdings ({col_list}) VALUES ({placeholders})"),
        normalised,
    )

    inserted = len(normalised)
    logger.info("Inserted %d rows into holdings", inserted)
    return inserted


def _convert_value(raw, mapping: ColumnMapping, holdings_col: str):
    """Convert a raw string value to the appropriate Python type."""
    if mapping.data_type == "decimal":
        try:
            val = str(raw).strip()
            # Handle parentheses-style negatives: (500.00) → -500.00
            if val.startswith("(") and val.endswith(")"):
                val = "-" + val[1:-1].strip()
            val = val.replace(",", "")
            return Decimal(val)
        except (InvalidOperation, ValueError):
            return None

    if mapping.data_type == "date":
        parsed = pd.to_datetime(str(raw).strip(), errors="coerce")
        if pd.isna(parsed):
            return None
        return parsed.date()

    # String — special-case 'side' to Title case (Long / Short).
    val = str(raw).strip()
    if holdings_col == "side":
        return val.title()
    return val
