"""Validation pipeline — ordered list of validators + runner."""

import logging
from collections import Counter

import pandas as pd

from src.validators.base import (
    BaseValidator,
    ColumnDef,
    ValidationContext,
    ValidationResult,
)
from src.validators.required_validator import RequiredValidator
from src.validators.date_validator import DateValidator
from src.validators.decimal_validator import DecimalValidator
from src.validators.side_validator import SideValidator
from src.validators.reference_validator import ReferenceValidator

logger = logging.getLogger(__name__)

# Order matters: cheap checks first, DB lookups last.
VALIDATORS: list[BaseValidator] = [
    RequiredValidator(),
    DateValidator(),
    DecimalValidator(),
    SideValidator(),
    ReferenceValidator(),
]

__all__ = [
    "VALIDATORS",
    "run_validation_pipeline",
    "ColumnDef",
    "ValidationContext",
    "ValidationResult",
]


def run_validation_pipeline(
    df: pd.DataFrame,
    ctx: ValidationContext,
) -> ValidationResult:
    """Run every registered validator and return a summary.

    Adds an ``_errors`` column (list[str] per row) to *df* **in-place**.
    """
    # Initialise the per-row error list.
    df["_errors"] = [[] for _ in range(len(df))]

    for validator in VALIDATORS:
        name = type(validator).__name__
        logger.info("Running %s …", name)
        df = validator.validate(df, ctx)

    # Build summary.
    error_counts: Counter[str] = Counter()
    for errors in df["_errors"]:
        for msg in errors:
            error_counts[msg] += 1

    has_errors = df["_errors"].apply(len) > 0
    total = len(df)
    failed = int(has_errors.sum())

    return ValidationResult(
        total_rows=total,
        valid_rows=total - failed,
        failed_rows=failed,
        error_summary=dict(error_counts),
    )
