"""Validator: checks that the side column contains LONG or SHORT."""

import pandas as pd

from src.validators.base import BaseValidator, ValidationContext


VALID_SIDES = {"LONG", "SHORT"}


class SideValidator(BaseValidator):

    def validate(self, df: pd.DataFrame, ctx: ValidationContext) -> pd.DataFrame:
        for col_def in ctx.column_defs:
            mapping = ctx.column_mappings.get(col_def.column_mapping)
            if mapping is None or mapping.db_field != "side":
                continue

            col = col_def.column_name
            if col not in df.columns:
                continue

            non_null = df[col].notna() & (df[col].astype(str).str.strip() != "")
            upper_vals = df.loc[non_null, col].astype(str).str.strip().str.upper()
            bad = non_null & ~upper_vals.isin(VALID_SIDES).reindex(df.index, fill_value=False)

            if bad.any():
                self._append_error(
                    df, bad,
                    f"'{col}' must be LONG or SHORT",
                )

        return df
