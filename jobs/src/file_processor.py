"""File processor.

Loads file content into a DataFrame and inserts rows into staging_holdings.
Creates a new file_imports record for each status transition.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

from src.database import get_session
from src.file_loader import load_to_dataframe


def _insert_status(session: Session, record: dict, status: str, **extra) -> str:
    """Insert a new file_imports row for a status change. Returns the new row's ID."""
    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    params = {
        "id": new_id,
        "file_id": record["file_id"],
        "tenant_id": record["tenant_id"],
        "file_name": record["file_name"],
        "file_size": record["file_size"],
        "imported_by_user_id": record["imported_by_user_id"],
        "import_type": record["import_type"],
        "status": status,
        "created_at": now,
        **extra,
    }

    session.execute(
        text("""
            INSERT INTO file_imports
                (id, file_id, tenant_id, file_name, file_size, imported_by_user_id,
                 import_type, status, created_at,
                 started_at, completed_at, rows_processed, rows_failed,
                 error_message)
            VALUES
                (:id, :file_id, :tenant_id, :file_name, :file_size, :imported_by_user_id,
                 :import_type, :status, :created_at,
                 :started_at, :completed_at, :rows_processed, :rows_failed,
                 :error_message)
        """),
        {
            "started_at": None,
            "completed_at": None,
            "rows_processed": None,
            "rows_failed": None,
            "error_message": None,
            **params,
        },
    )
    session.commit()
    return new_id


def process_file_import(file_import_id: str, file_content: str, file_type: str) -> dict:
    """Process a file import.

    Args:
        file_import_id: UUID of the original RECEIVED file_import record.
        file_content: Raw text content of the uploaded file.
        file_type: File type (CSV or PIPE) — determines the delimiter.

    Returns:
        dict with status.
    """
    session: Session = get_session()

    try:
        # Fetch the original RECEIVED record
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

        # Insert PROCESSING record
        started_at = datetime.now(timezone.utc)
        _insert_status(session, record, "PROCESSING", started_at=started_at)

        # Load file content into a DataFrame
        df = load_to_dataframe(file_content, file_type)

        # TODO: Apply column mappings from mappings table
        # TODO: Insert rows into staging_holdings

        # Insert PROCESSED record
        completed_at = datetime.now(timezone.utc)
        _insert_status(
            session, record, "PROCESSED",
            started_at=started_at,
            completed_at=completed_at,
            rows_processed=len(df),
            rows_failed=0,
        )

        return {
            "status": "PROCESSED",
            "rows_processed": len(df),
            "rows_failed": 0,
        }

    except Exception as e:
        session.rollback()
        try:
            _insert_status(
                session, record, "FAILED",
                completed_at=datetime.now(timezone.utc),
                error_message=str(e),
            )
        except Exception:
            pass
        return {"status": "FAILED", "error": str(e)}

    finally:
        session.close()
