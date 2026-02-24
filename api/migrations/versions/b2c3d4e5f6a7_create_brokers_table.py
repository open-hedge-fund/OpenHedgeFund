"""create brokers table

Revision ID: b2c3d4e5f6a7
Revises: 95fcdb8dd287
Create Date: 2026-02-24 14:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = '95fcdb8dd287'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('brokers',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('broker_code', sa.String(length=50), nullable=False),
    sa.Column('broker_description', sa.String(length=200), nullable=False),
    sa.Column('tenant_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('brokers')
