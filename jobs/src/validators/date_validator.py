"""Validator: checks that date columns contain parseable dates."""

import pandas as pd

from src.validators.base import BaseValidator, ValidationContext


class DateValidator(BaseValidator):

    def validate(self, df: pd.DataFrame, ctx: ValidationContext) -> pd.DataFrame:
        for col_def in ctx.column_defs:
            mapping = ctx.column_mappings.get(col_def.column_mapping)
            if mapping is None or mapping.data_type != "date":
                continue

            col = col_def.column_name
            if col not in df.columns:
                continue

            non_null = df[col].notna() & (df[col].astype(str).str.strip() != "")
            parsed = pd.to_datetime(df.loc[non_null, col], errors="coerce")
            bad = non_null & parsed.isna().reindex(df.index, fill_value=False)

            if bad.any():
                self._append_error(df, bad, f"'{col}' contains an invalid date")

        return df
