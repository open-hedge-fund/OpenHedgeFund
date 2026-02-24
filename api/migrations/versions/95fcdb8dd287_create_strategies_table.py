"""create strategies table

Revision ID: 95fcdb8dd287
Revises: 6b843a246174
Create Date: 2026-02-24 13:25:04.890032
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '95fcdb8dd287'
down_revision: Union[str, None] = '6b843a246174'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('strategies',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('strategy_code', sa.String(length=30), nullable=False),
    sa.Column('strategy_description', sa.String(length=100), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'strategy_code', name='uq_strategies_tenant_code')
    )


def downgrade() -> None:
    op.drop_table('strategies')
