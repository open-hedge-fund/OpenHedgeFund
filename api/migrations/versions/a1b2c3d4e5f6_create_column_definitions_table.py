"""create column_definitions table

Revision ID: a1b2c3d4e5f6
Revises: 0c2375853a41
Create Date: 2026-02-17 22:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '0c2375853a41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('column_definitions',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('file_id', sa.BigInteger(), nullable=False),
    sa.Column('column_name', sa.String(length=255), nullable=False),
    sa.Column('table_mapping', sa.String(length=255), nullable=False),
    sa.Column('column_mapping', sa.String(length=255), nullable=False),
    sa.Column('date_format', sa.String(length=50), nullable=True),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['file_id'], ['files.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('column_definitions')
