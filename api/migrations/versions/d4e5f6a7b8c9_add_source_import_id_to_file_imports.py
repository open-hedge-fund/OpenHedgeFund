"""add source_import_id to file_imports

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-02-23 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("file_imports", sa.Column("source_import_id", sa.UUID(), nullable=True))
    op.create_index("ix_file_imports_source_import_id", "file_imports", ["source_import_id"])
    # Backfill: set source_import_id = id for all existing rows
    op.execute("UPDATE file_imports SET source_import_id = id WHERE source_import_id IS NULL")


def downgrade() -> None:
    op.drop_index("ix_file_imports_source_import_id", table_name="file_imports")
    op.drop_column("file_imports", "source_import_id")
