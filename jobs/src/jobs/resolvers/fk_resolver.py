"""Foreign-key resolver — translates reference-table values into holdings FK IDs."""

import logging

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.column_mapper import ColumnMapping
from src.jobs.validators.base import ColumnDef

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

# When multiple identifiers resolve to the same FK (e.g. security_id),
# prefer more precise/unique identifiers over less unique ones.
# Lower number = higher priority.
FK_IDENTIFIER_PRIORITY: dict[tuple[str, str], int] = {
    ("securities", "id_1"): 0,
    ("securities", "id_2"): 1,
    ("securities", "id_3"): 2,
    ("securities", "symbol"): 3,
}

# Whitelist for table names used in queries.
ALLOWED_TABLES = frozenset(
    {
        "securities",
        "custodians",
        "funds",
    }
)

# Tables where missing values are auto-created instead of flagged as errors.
AUTO_CREATE_TABLES: frozenset[str] = frozenset({"securities"})


def resolve_foreign_keys(
    df: pd.DataFrame,
    col_defs: list[ColumnDef],
    mappings: dict[str, ColumnMapping],
    session: Session,
    tenant_id: str,
) -> tuple[pd.DataFrame, int]:
    """Add ``_resolved_<fk>`` columns to *df* for each FK that can be resolved.

    Returns ``(mutated_DataFrame, auto_created_count)``.
    """
    resolved_cols: set[str] = set()
    # Track (table_name, db_field) per resolved column for auto-creation.
    resolved_meta: dict[str, tuple[str, str, str]] = {}  # resolved_name → (table, field, src_col)
    auto_created_count = 0

    # Sort col_defs so higher-priority identifiers are resolved first.
    # For entries not in the priority map, use a high default so they
    # sort after all prioritised identifiers.
    _DEFAULT_PRIORITY = 999
    sorted_col_defs = sorted(
        col_defs,
        key=lambda cd: FK_IDENTIFIER_PRIORITY.get(
            (
                mappings.get(cd.column_mapping, ColumnMapping("", "", "")).table_name,
                mappings.get(cd.column_mapping, ColumnMapping("", "", "")).db_field,
            ),
            _DEFAULT_PRIORITY,
        ),
    )

    for col_def in sorted_col_defs:
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
        df[resolved_name] = df[col].astype(str).str.strip().str.upper().map(id_map)
        resolved_cols.add(resolved_name)
        resolved_meta[resolved_name] = (mapping.table_name, mapping.db_field, col)
        logger.info("Resolved %s → %s (%d unique values)", col, resolved_name, len(id_map))

    # For mapped FKs that were resolved, flag rows where the value wasn't found.
    has_errors = df["_errors"].apply(len) > 0
    valid_mask = ~has_errors

    for resolved_name in resolved_cols:
        fk = resolved_name.removeprefix("_resolved_")
        missing_fk = valid_mask & df[resolved_name].isna()
        if not missing_fk.any():
            continue

        table, field, src_col = resolved_meta[resolved_name]

        if table in AUTO_CREATE_TABLES:
            # Auto-create securities for missing values.
            missing_values = (
                df.loc[missing_fk, src_col]
                .astype(str).str.strip().str.upper()
                .unique()
                .tolist()
            )
            new_ids = _auto_create_securities(session, missing_values, field, tenant_id)
            auto_created_count += len(new_ids)

            # Re-map the missing rows using the newly created IDs.
            upper_vals = df[src_col].astype(str).str.strip().str.upper()
            df.loc[missing_fk, resolved_name] = upper_vals[missing_fk].map(new_ids)

            # Flag any still-unresolved rows (should not happen, but be safe).
            still_missing = missing_fk & df[resolved_name].isna()
            if still_missing.any():
                for idx in df.index[still_missing]:
                    df.at[idx, "_errors"].append(
                        f"Could not resolve '{fk}' — value not found in reference table"
                    )
        else:
            for idx in df.index[missing_fk]:
                df.at[idx, "_errors"].append(
                    f"Could not resolve '{fk}' — value not found in reference table"
                )

    return df, auto_created_count


def _auto_create_securities(
    session: Session,
    missing_values: list[str],
    db_field: str,
    tenant_id: str,
) -> dict[str, int]:
    """Insert new securities for each missing value and return {UPPER(value): new_id}."""
    if not missing_values:
        return {}

    # Validate db_field against known security identifier columns.
    allowed_fields = {"symbol", "id_1", "id_2", "id_3"}
    if db_field not in allowed_fields:
        logger.warning("Cannot auto-create securities for field: %s", db_field)
        return {}

    new_ids: dict[str, int] = {}
    for val in missing_values:
        result = session.execute(
            text(
                f"INSERT INTO securities (tenant_id, is_active, {db_field}) "
                f"VALUES (:tid, true, :val) "
                f"RETURNING id"
            ),
            {"tid": tenant_id, "val": val},
        )
        new_id = result.scalar_one()
        new_ids[val] = new_id

    session.flush()
    logger.info("Auto-created %d securities via %s", len(new_ids), db_field)
    return new_ids


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
