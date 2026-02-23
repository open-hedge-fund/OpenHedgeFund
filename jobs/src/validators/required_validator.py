"""Validator: checks that non-nullable columns are not blank/null."""

import pandas as pd

from src.validators.base import BaseValidator, ValidationContext


class RequiredValidator(BaseValidator):

    def validate(self, df: pd.DataFrame, ctx: ValidationContext) -> pd.DataFrame:
        for col_def in ctx.column_defs:
            mapping = ctx.column_mappings.get(col_def.column_mapping)
            if mapping is None or mapping.nullable:
                continue

            col = col_def.column_name
            if col not in df.columns:
                continue

            mask = df[col].isna() | (df[col].astype(str).str.strip() == "")
            if mask.any():
                self._append_error(df, mask, f"'{col}' is required and cannot be blank")

        return df
