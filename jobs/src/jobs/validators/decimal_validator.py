"""Validator: checks that decimal columns contain valid numbers."""

import re

import pandas as pd

from src.jobs.validators.base import BaseValidator, ValidationContext

# Matches values wrapped in parentheses, e.g. "(500.00)" or "( 1,234.56 )"
_PARENS_RE = re.compile(r"^\((.+)\)$")


def _normalise_decimal(val: str) -> str:
    """Convert financial-format decimals to standard numeric strings.

    Handles:
    - Parentheses-style negatives: ``(500.00)`` → ``-500.00``
    - Thousands-separator commas: ``1,234.56`` → ``1234.56``
    """
    val = val.strip()
    m = _PARENS_RE.match(val)
    if m:
        val = "-" + m.group(1).strip()
    val = val.replace(",", "")
    return val


class DecimalValidator(BaseValidator):
    def validate(self, df: pd.DataFrame, ctx: ValidationContext) -> pd.DataFrame:
        for col_def in ctx.column_defs:
            mapping = ctx.column_mappings.get(col_def.column_mapping)
            if mapping is None or mapping.data_type != "decimal":
                continue

            col = col_def.column_name
            if col not in df.columns:
                continue

            non_null = df[col].notna() & (df[col].astype(str).str.strip() != "")

            # Normalise financial formats (parentheses negatives, commas)
            # in-place so downstream steps (inserter) also see clean values.
            df.loc[non_null, col] = df.loc[non_null, col].astype(str).map(_normalise_decimal)

            parsed = pd.to_numeric(df.loc[non_null, col], errors="coerce")
            bad = non_null & parsed.isna().reindex(df.index, fill_value=False)

            if bad.any():
                self._append_error(df, bad, f"'{col}' contains an invalid number")

        return df
