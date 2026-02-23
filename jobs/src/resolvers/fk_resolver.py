"""Foreign-key resolver — translates reference-table values into holdings FK IDs."""

import logging

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.column_mapper import ColumnMapping
from src.validators.base import ColumnDef

logger = logging.getLogger(__name__)

# (table_name, db_field) → holdings FK column name
HOLDINGS_FK_MAP: dict[tuple[str, str], str] = {
    ("securities", "symbol"): "security_id",
    ("securities", "id_1"): "security_id",
    ("securities", "id_2"): "security_id",
    ("securities", "id_3"): "security_id",
    ("custodians", "account_number"): "custodian_id",
    ("custodians", "custodian_code"): "custodian_id",
    ("funds", "fund_code"): "fund_id",
}

# Whitelist for table names used in queries.
ALLOWED_TABLES = frozenset({
    "securities",
    "custodians",
    "funds",
})


def resolve_foreign_keys(
    df: pd.DataFrame,
    col_defs: list[ColumnDef],
    mappings: dict[str, ColumnMapping],
    session: Session,
    tenant_id: str,
) -> pd.DataFrame:
    """Add ``_resolved_<fk>`` columns to *df* for each FK that can be resolved.

    Returns the mutated DataFrame.
    """
    resolved_cols: set[str] = set()

    for col_def in col_defs:
        mapping = mappings.get(col_def.column_mapping)
        if mapping is None:
            continue

        key = (mapping.table_name, mapping.db_field)
        fk_col = HOLDINGS_FK_MAP.get(key)
        if fk_col is None:
            continue

        resolved_name = f"_resolved_{fk_col}"

        # Skip if this FK was already resolved by a previous column.
        if resolved_name in resolved_cols:
            continue

        col = col_def.column_name
        if col not in df.columns:
            continue

        if mapping.table_name not in ALLOWED_TABLES:
            continue

        id_map = _build_id_map(session, mapping.table_name, mapping.db_field, tenant_id)
        df[resolved_name] = (
            df[col]
            .astype(str)
            .str.strip()
            .str.upper()
            .map(id_map)
        )
        resolved_cols.add(resolved_name)
        logger.info("Resolved %s → %s (%d unique values)", col, resolved_name, len(id_map))

    # For mapped FKs that were resolved, flag rows where the value wasn't found.
    has_errors = df["_errors"].apply(len) > 0
    valid_mask = ~has_errors

    for resolved_name in resolved_cols:
        fk = resolved_name.removeprefix("_resolved_")
        missing_fk = valid_mask & df[resolved_name].isna()
        if missing_fk.any():
            for idx in df.index[missing_fk]:
                df.at[idx, "_errors"].append(f"Could not resolve '{fk}' — value not found in reference table")

    return df


def _build_id_map(
    session: Session,
    table: str,
    field: str,
    tenant_id: str,
) -> dict[str, int]:
    """Return {UPPER(field_value): id} for active rows in *table*."""
    result = session.execute(
        text(f"SELECT id, UPPER({field}) FROM {table} WHERE tenant_id = :tid AND is_active = true"),
        {"tid": tenant_id},
    )
    return {row[1]: row[0] for row in result if row[1] is not None}
