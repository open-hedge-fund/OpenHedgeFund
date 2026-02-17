"""File processor stub.

Creates a new file_imports record for each status transition: PROCESSING → PROCESSED/FAILED.
The RECEIVED record is created by the API at upload time.
TODO: Implement actual file processing once column mappings table is in place.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

from src.database import get_session


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
                 started_at, completed_at, duration_seconds, error_message)
            VALUES
                (:id, :file_id, :tenant_id, :file_name, :file_size, :imported_by_user_id,
                 :import_type, :status, :created_at,
                 :started_at, :completed_at, :duration_seconds, :error_message)
        """),
        {
            "started_at": None,
            "completed_at": None,
            "duration_seconds": None,
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

        # TODO: Parse file_content and insert rows into staging_holdings
        # This requires the column mappings table to map file headers to staging_holdings columns

        # Insert PROCESSED record
        completed_at = datetime.now(timezone.utc)
        duration = int((completed_at - started_at).total_seconds())
        _insert_status(
            session, record, "PROCESSED",
            started_at=started_at, completed_at=completed_at, duration_seconds=duration,
        )

        return {
            "status": "PROCESSED",
            "duration_seconds": duration,
        }

    except Exception as e:
        session.rollback()
        try:
            _insert_status(
                session, record, "FAILED",
                completed_at=datetime.now(timezone.utc), error_message=str(e),
            )
        except Exception:
            pass
        return {"status": "FAILED", "error": str(e)}

    finally:
        session.close()
