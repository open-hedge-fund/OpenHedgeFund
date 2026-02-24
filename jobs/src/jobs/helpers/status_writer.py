"""Shared helper for writing file_imports status rows."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session


def insert_status(session: Session, record: dict, status: str, **extra) -> str:
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
                 error_message, error_details)
            VALUES
                (:id, :file_id, :tenant_id, :file_name, :file_size, :imported_by_user_id,
                 :import_type, :status, :created_at,
                 :started_at, :completed_at, :rows_processed, :rows_failed,
                 :error_message, CAST(:error_details AS jsonb))
        """),
        {
            "started_at": None,
            "completed_at": None,
            "rows_processed": None,
            "rows_failed": None,
            "error_message": None,
            "error_details": None,
            **params,
        },
    )
    session.commit()
    return new_id
