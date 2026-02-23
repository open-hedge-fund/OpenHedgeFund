"""Base classes for the validation pipeline."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

import pandas as pd
from sqlalchemy.orm import Session

from src.column_mapper import ColumnMapping


@dataclass
class ColumnDef:
    """A single column definition from the database — maps a CSV header to a DB field."""

    column_name: str      # CSV header (e.g. "Custodian_ID")
    table_mapping: str    # Target table  (e.g. "custodians")
    column_mapping: str   # Target field  (e.g. "account_number")


@dataclass
class ValidationContext:
    """Everything a validator needs to do its work."""

    session: Session
    tenant_id: str
    file_id: int
    column_defs: list[ColumnDef]
    column_mappings: dict[str, ColumnMapping]


@dataclass
class ValidationResult:
    """Summary returned after the full pipeline finishes."""

    total_rows: int = 0
    valid_rows: int = 0
    failed_rows: int = 0
    error_summary: dict[str, int] = field(default_factory=dict)


class BaseValidator(ABC):
    """Abstract validator — subclass and implement ``validate``."""

    @abstractmethod
    def validate(self, df: pd.DataFrame, ctx: ValidationContext) -> pd.DataFrame:
        """Validate the DataFrame in-place and return it.

        Validators should call ``_append_error`` for every row that fails a
        check.  They must **not** drop rows — rows with errors are simply
        tagged so downstream steps can skip them.
        """

    @staticmethod
    def _append_error(df: pd.DataFrame, mask: pd.Series, message: str) -> None:
        """Append *message* to the ``_errors`` list of every row where *mask* is True."""
        for idx in df.index[mask]:
            df.at[idx, "_errors"].append(message)
