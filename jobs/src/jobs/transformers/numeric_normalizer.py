"""Transform step: normalise numeric strings before validation.

Strips thousands-separator commas and common currency symbols from columns
whose ``data_type`` is ``"decimal"`` so that downstream validators (which are
read-only) see clean numeric values.
"""

import re

import pandas as pd

from src.column_mapper import ColumnMapping
from src.jobs.validators.base import ColumnDef

# Matches leading currency symbols (e.g. $, €, £, ¥) and thousands-separator commas.
_CURRENCY_SYMBOLS = re.compile(r"[$€£¥]")


def normalize_numeric_columns(
    df: pd.DataFrame,
    column_defs: list[ColumnDef],
    column_mappings: dict[str, ColumnMapping],
) -> pd.DataFrame:
    """Strip commas and currency symbols from decimal columns **in-place**.

    Only touches columns whose column_mapping has ``data_type == "decimal"``.
    Non-string values and nulls are left untouched.
    """
    for col_def in column_defs:
        mapping = column_mappings.get(col_def.column_mapping)
        if mapping is None or mapping.data_type != "decimal":
            continue

        col = col_def.column_name
        if col not in df.columns:
            continue

        series = df[col]
        is_str = series.apply(lambda v: isinstance(v, str))
        if not is_str.any():
            continue

        cleaned = series[is_str].str.replace(",", "", regex=False)
        cleaned = cleaned.str.replace(_CURRENCY_SYMBOLS, "", regex=True)
        cleaned = cleaned.str.strip()
        df.loc[is_str, col] = cleaned

    return df
