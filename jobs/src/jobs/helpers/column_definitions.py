"""Shared helper for fetching column definitions."""

from sqlalchemy import text
from sqlalchemy.orm import Session

from src.jobs.validators.base import ColumnDef


def fetch_column_definitions(session: Session, file_id: int, tenant_id: str) -> list[ColumnDef]:
    """Load column_definitions rows for a file and return them as ColumnDef objects."""
    result = session.execute(
        text("""
            SELECT column_name, table_mapping, column_mapping
            FROM column_definitions
            WHERE file_id = :file_id AND tenant_id = :tenant_id
        """),
        {"file_id": file_id, "tenant_id": tenant_id},
    )
    return [
        ColumnDef(
            column_name=row.column_name,
            table_mapping=row.table_mapping,
            column_mapping=row.column_mapping,
        )
        for row in result
    ]
