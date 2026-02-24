"""File processor.

Loads file content into a DataFrame, validates it through the pluggable
validator pipeline, resolves foreign keys, inserts valid rows into holdings,
and reports errors back on the file_imports record.
"""

import json
import logging
from datetime import datetime, timezone

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.column_mapper import COLUMN_MAPPINGS
from src.database import get_session
from src.jobs.helpers.column_definitions import fetch_column_definitions
from src.jobs.helpers.file_loader import load_to_dataframe
from src.jobs.helpers.status_writer import insert_status
from src.jobs.inserters.holdings_inserter import insert_holdings
from src.jobs.resolvers.fk_resolver import resolve_foreign_keys
from src.jobs.transformers import normalize_numeric_columns
from src.jobs.validators import (
    ColumnDef,
    ValidationContext,
    ValidationResult,
    run_validation_pipeline,
)

logger = logging.getLogger(__name__)

MAX_SAMPLE_ERRORS = 25




def _build_error_report(df: pd.DataFrame, result: ValidationResult) -> tuple[str | None, str | None]:
    """Build a human-readable error message and a JSONB-ready detail string.

    Returns (error_message, error_details_json) — both ``None`` when there
    are no errors.
    """
    if result.failed_rows == 0:
        return None, None

    # Sample up to MAX_SAMPLE_ERRORS failed rows for the detail payload.
    has_errors = df["_errors"].apply(len) > 0
    failed_df = df[has_errors].head(MAX_SAMPLE_ERRORS)

    sample_errors = []
    internal_cols = {c for c in df.columns if c.startswith("_")}
    for idx, row in failed_df.iterrows():
        data = {col: _safe_str(row[col]) for col in df.columns if col not in internal_cols}
        sample_errors.append({
            "row": int(idx) + 2,  # +2 = 1-based + header row
            "errors": list(row["_errors"]),
            "data": data,
        })

    details = {
        "total_rows": result.total_rows,
        "valid_rows": result.valid_rows,
        "failed_rows": result.failed_rows,
        "error_summary": result.error_summary,
        "sample_errors": sample_errors,
    }

    error_message = (
        f"{result.failed_rows} of {result.total_rows} rows failed validation"
    )

    return error_message, json.dumps(details)


def _safe_str(val) -> str | None:
    """Convert a value to string, returning None for NaN/None."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    return str(val)


# ── main entry point ────────────────────────────────────────────────────
def process_file_import(file_import_id: str, file_content: str, file_type: str) -> dict:
    """Process a file import end-to-end.

    1. Load DataFrame
    2. Fetch column definitions
    3. Run validation pipeline
    4. Resolve foreign keys
    5. Insert valid rows into holdings
    6. Report results
    """
    session: Session = get_session()

    try:
        # ── fetch the original RECEIVED record ──────────────────────────
        result = session.execute(
            text("""
                SELECT id, file_id, tenant_id, file_name, file_size,
                       imported_by_user_id, import_type
                FROM file_imports
                WHERE id = :fid
            """),
            {"fid": file_import_id},
        )
        record = result.mappings().first()

        if not record:
            return {"status": "FAILED", "error": "FileImport not found"}

        # ── mark PROCESSING ─────────────────────────────────────────────
        started_at = datetime.now(timezone.utc)
        insert_status(session, record, "PROCESSING", started_at=started_at)

        # ── 1. load DataFrame ───────────────────────────────────────────
        df = load_to_dataframe(file_content, file_type)
        logger.info("Loaded %d rows from file %s", len(df), record["file_name"])

        # ── 2. fetch column definitions ─────────────────────────────────
        col_defs = fetch_column_definitions(session, record["file_id"], record["tenant_id"])
        if not col_defs:
            raise ValueError("No column definitions found for this file")

        # ── 2b. normalise numeric strings (strip commas, currency symbols)
        df = normalize_numeric_columns(df, col_defs, COLUMN_MAPPINGS)

        # ── 3. run validation pipeline ──────────────────────────────────
        ctx = ValidationContext(
            session=session,
            tenant_id=str(record["tenant_id"]),
            file_id=record["file_id"],
            column_defs=col_defs,
            column_mappings=COLUMN_MAPPINGS,
        )
        val_result = run_validation_pipeline(df, ctx)
        logger.info(
            "Validation: %d valid, %d failed out of %d",
            val_result.valid_rows, val_result.failed_rows, val_result.total_rows,
        )

        # ── 4. resolve foreign keys ────────────────────────────────────
        df, auto_created = resolve_foreign_keys(df, col_defs, COLUMN_MAPPINGS, session, str(record["tenant_id"]))
        if auto_created:
            logger.info("Auto-created %d new securities", auto_created)

        # ── 5. recount after FK resolution (may have added errors) ─────
        has_errors = df["_errors"].apply(len) > 0
        valid_rows = int((~has_errors).sum())
        failed_rows = int(has_errors.sum())

        val_result.valid_rows = valid_rows
        val_result.failed_rows = failed_rows

        # ── 6. insert valid rows ────────────────────────────────────────
        inserted = 0
        if valid_rows > 0:
            inserted = insert_holdings(df, col_defs, COLUMN_MAPPINGS, session, str(record["tenant_id"]))
            session.commit()
            logger.info("Inserted %d holdings rows", inserted)

        # ── 7. build error report ───────────────────────────────────────
        error_message, error_details = _build_error_report(df, val_result)

        # ── 8. final status ─────────────────────────────────────────────
        completed_at = datetime.now(timezone.utc)
        final_status = "FAILED" if valid_rows == 0 else "PROCESSED"

        insert_status(
            session, record, final_status,
            started_at=started_at,
            completed_at=completed_at,
            rows_processed=valid_rows,
            rows_failed=failed_rows,
            error_message=error_message,
            error_details=error_details,
        )

        return {
            "status": final_status,
            "rows_processed": valid_rows,
            "rows_failed": failed_rows,
            "inserted": inserted,
            "securities_auto_created": auto_created,
        }

    except Exception as e:
        logger.exception("File processing failed")
        session.rollback()
        try:
            insert_status(
                session, record, "FAILED",
                completed_at=datetime.now(timezone.utc),
                error_message=str(e),
            )
        except Exception:
            pass
        return {"status": "FAILED", "error": str(e)}

    finally:
        session.close()
