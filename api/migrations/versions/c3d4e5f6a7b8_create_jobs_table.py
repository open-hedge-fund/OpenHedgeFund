"""create jobs table and fx_rates unique constraint

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-02-17 23:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create jobs table
    op.create_table('jobs',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('task_name', sa.String(length=255), nullable=False),
        sa.Column('cron_expression', sa.String(length=100), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_status', sa.String(length=20), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', 'tenant_id'),
    )

    # Add unique constraint on fx_rates to enable upsert
    op.create_unique_constraint(
        'uq_fx_rates_date_ref_ccy_ccy_tenant',
        'fx_rates',
        ['rate_date', 'ref_currency_id', 'currency_id', 'tenant_id'],
    )

    # Seed the FX rate fetcher job (uses first tenant)
    op.execute("""
        INSERT INTO jobs (name, task_name, cron_expression, is_active, tenant_id)
        SELECT 'Fetch FX Rates', 'src.tasks.fetch_fx_rates', '0 6 * * *', true, id
        FROM tenants
        ORDER BY created_at
        LIMIT 1
    """)


def downgrade() -> None:
    op.drop_constraint('uq_fx_rates_date_ref_ccy_ccy_tenant', 'fx_rates', type_='unique')
    op.drop_table('jobs')
