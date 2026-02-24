"""Validator: checks that values exist in their reference tables."""

import logging

import pandas as pd
from sqlalchemy import text

from src.jobs.validators.base import BaseValidator, ValidationContext

logger = logging.getLogger(__name__)

# Only these tables may be queried — prevents SQL injection via table_mapping.
ALLOWED_TABLES = frozenset({
    "securities",
    "custodians",
    "funds",
    "asset_types",
    "continents",
    "countries",
    "currencies",
    "market_categories",
    "security_subtypes",
    "security_types",
})


class ReferenceValidator(BaseValidator):
    """Bulk-loads valid values from reference tables, then checks each row."""

    def validate(self, df: pd.DataFrame, ctx: ValidationContext) -> pd.DataFrame:
        # Group column_defs by (table, field) to avoid duplicate DB lookups.
        lookups: dict[tuple[str, str], list] = {}
        for col_def in ctx.column_defs:
            mapping = ctx.column_mappings.get(col_def.column_mapping)
            if mapping is None:
                continue
            # Skip columns that map directly to the holdings table.
            if mapping.table_name == "holdings":
                continue
            # Securities are auto-created during FK resolution; skip validation here.
            if mapping.table_name == "securities":
                continue
            if mapping.table_name not in ALLOWED_TABLES:
                logger.warning("Skipping disallowed table: %s", mapping.table_name)
                continue

            key = (mapping.table_name, mapping.db_field)
            lookups.setdefault(key, []).append(col_def)

        # For each unique (table, field), fetch valid values once.
        for (table, field), col_defs in lookups.items():
            valid_values = self._load_valid_values(ctx, table, field)

            for col_def in col_defs:
                col = col_def.column_name
                if col not in df.columns:
                    continue

                non_null = df[col].notna() & (df[col].astype(str).str.strip() != "")
                upper_vals = df.loc[non_null, col].astype(str).str.strip().str.upper()
                bad = non_null & ~upper_vals.isin(valid_values).reindex(df.index, fill_value=False)

                if bad.any():
                    self._append_error(
                        df, bad,
                        f"'{col}' not found in {table}.{field}",
                    )

        return df

    @staticmethod
    def _load_valid_values(ctx: ValidationContext, table: str, field: str) -> set[str]:
        """Load the set of UPPER-cased valid values for a (table, field) pair."""
        # table and field are validated against ALLOWED_TABLES above;
        # we use f-string only for the whitelisted identifier, not user input.
        result = ctx.session.execute(
            text(f"SELECT UPPER({field}) FROM {table} WHERE tenant_id = :tid AND is_active = true"),
            {"tid": ctx.tenant_id},
        )
        return {row[0] for row in result if row[0] is not None}
