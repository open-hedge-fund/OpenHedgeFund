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

# Values that should be treated as NULL (pandas NaN stringified).
_NULL_STRINGS: frozenset[str] = frozenset({"NAN", "NONE", "NULL", "NA", ""})


def _is_null_value(val: str) -> bool:
    """Return True if *val* is a stringified null/NaN."""
    return val.strip().upper() in _NULL_STRINGS


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

    # Build a map of all security identifier columns available in the DataFrame
    # so auto-creation can populate multiple fields (e.g. symbol + id_1).
    security_field_cols: dict[str, str] = {}  # db_field → DataFrame column name
    for cd in col_defs:
        m = mappings.get(cd.column_mapping)
        if m and m.table_name == "securities" and cd.column_name in df.columns:
            security_field_cols.setdefault(m.db_field, cd.column_name)

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

        col = col_def.column_name
        if col not in df.columns:
            continue

        if mapping.table_name not in ALLOWED_TABLES:
            continue

        id_map = _build_id_map(session, mapping.table_name, mapping.db_field, tenant_id)

        if resolved_name not in resolved_cols:
            # First identifier for this FK — create the resolved column.
            df[resolved_name] = df[col].astype(str).str.strip().str.upper().map(id_map)
            resolved_cols.add(resolved_name)
            resolved_meta[resolved_name] = (mapping.table_name, mapping.db_field, col)
            logger.info("Resolved %s → %s (%d unique values)", col, resolved_name, len(id_map))
        else:
            # Fill gaps: for rows still unresolved, try this lower-priority identifier.
            still_na = df[resolved_name].isna()
            if not still_na.any():
                continue
            fallback = df.loc[still_na, col].astype(str).str.strip().str.upper().map(id_map)
            filled = fallback.dropna()
            if not filled.empty:
                df.loc[filled.index, resolved_name] = filled
                logger.info("Backfilled %d rows for %s via %s", len(filled), resolved_name, col)

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
            # Auto-create securities for rows still missing a resolved FK.
            # For each unresolved row, pick the best available identifier.
            rows_to_create = _collect_rows_for_auto_creation(
                df, missing_fk, security_field_cols,
            )

            if rows_to_create:
                new_ids = _auto_create_securities_batch(
                    session, rows_to_create, tenant_id,
                )
                auto_created_count += len(new_ids)

                # Re-map: for each row, look up its identifier value in new_ids.
                for idx, fields in rows_to_create.items():
                    # The key in new_ids is the first field's UPPER value.
                    key = next(iter(fields.values())).upper()
                    if key in new_ids:
                        df.at[idx, resolved_name] = new_ids[key]

            # Flag rows that are still unresolved (all identifiers were null).
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


def _collect_rows_for_auto_creation(
    df: pd.DataFrame,
    missing_fk: pd.Series,
    security_field_cols: dict[str, str],
) -> dict[int, dict[str, str]]:
    """For each unresolved row, collect all non-null security identifier values.

    Returns ``{row_index: {db_field: value, ...}}``.
    Rows where all identifier columns are null are skipped.
    """
    allowed_fields = {"symbol", "id_1", "id_2", "id_3"}
    rows: dict[int, dict[str, str]] = {}

    for idx in df.index[missing_fk]:
        fields: dict[str, str] = {}
        for db_field, col_name in security_field_cols.items():
            if db_field not in allowed_fields:
                continue
            cell = df.at[idx, col_name]
            if cell is None:
                continue
            s = str(cell).strip()
            if not _is_null_value(s):
                fields[db_field] = s
        if fields:
            rows[idx] = fields

    return rows


def _auto_create_securities_batch(
    session: Session,
    rows_to_create: dict[int, dict[str, str]],
    tenant_id: str,
) -> dict[str, int]:
    """Insert new securities and return {UPPER(first_identifier): new_id}.

    Deduplicates by the full set of identifier values so the same security
    is only created once even if it appears on multiple rows.
    """
    if not rows_to_create:
        return {}

    # Deduplicate: group rows by their identifier signature.
    # Key = frozenset of (db_field, UPPER(value)) pairs.
    unique_secs: dict[frozenset, dict[str, str]] = {}
    row_to_key: dict[int, frozenset] = {}
    for idx, fields in rows_to_create.items():
        sig = frozenset((k, v.upper()) for k, v in fields.items())
        unique_secs[sig] = fields
        row_to_key[idx] = sig

    new_ids: dict[str, int] = {}  # UPPER(first_value) → id
    sig_to_id: dict[frozenset, int] = {}

    for sig, fields in unique_secs.items():
        col_names = ", ".join(fields.keys())
        placeholders = ", ".join(f":{k}" for k in fields.keys())
        params = {"tid": tenant_id}
        for k, v in fields.items():
            params[k] = v

        result = session.execute(
            text(
                f"INSERT INTO securities (tenant_id, is_active, {col_names}) "
                f"VALUES (:tid, true, {placeholders}) "
                f"RETURNING id"
            ),
            params,
        )
        new_id = result.scalar_one()
        sig_to_id[sig] = new_id

        # Map each identifier value to this ID for re-mapping.
        for _field, val in fields.items():
            new_ids[val.upper()] = new_id

    # Also map row indices directly for accurate re-mapping.
    for idx, sig in row_to_key.items():
        first_val = next(iter(rows_to_create[idx].values())).upper()
        new_ids[first_val] = sig_to_id[sig]

    session.flush()
    logger.info("Auto-created %d unique securities", len(sig_to_id))
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
