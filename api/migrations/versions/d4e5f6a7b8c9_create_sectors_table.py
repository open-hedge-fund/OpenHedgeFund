"""create sectors table and add sector_id to securities

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-02-24 17:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'sectors',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('sector_code', sa.String(length=30), nullable=False),
        sa.Column('sector_desc', sa.String(length=100), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.add_column('securities', sa.Column('sector_id', sa.BigInteger(), nullable=True))
    op.create_foreign_key(
        'fk_securities_sector_id',
        'securities',
        'sectors',
        ['sector_id'],
        ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_securities_sector_id', 'securities', type_='foreignkey')
    op.drop_column('securities', 'sector_id')
    op.drop_table('sectors')
