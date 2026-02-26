"""Validation pipeline — ordered list of validators + runner."""

import logging
from collections import Counter

import pandas as pd

from src.jobs.validators.base import (
    BaseValidator,
    ColumnDef,
    ValidationContext,
    ValidationResult,
)
from src.jobs.validators.required_validator import RequiredValidator
from src.jobs.validators.date_validator import DateValidator
from src.jobs.validators.decimal_validator import DecimalValidator
from src.jobs.validators.side_validator import SideValidator

logger = logging.getLogger(__name__)

# Order matters: cheap checks first.
# Reference validation is handled implicitly by the FK resolver —
# if a value doesn't exist in the reference table, the FK can't be resolved.
VALIDATORS: list[BaseValidator] = [
    RequiredValidator(),
    DateValidator(),
    DecimalValidator(),
    SideValidator(),
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
