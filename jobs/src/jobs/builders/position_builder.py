"""Aggregates holdings into positions for a given date and tenant.

Uses SQL-level aggregation to avoid Decimal->float precision loss
and keep all data processing inside PostgreSQL.
"""

import logging
from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

AGGREGATE_SQL = text("""
    INSERT INTO positions
        (position_date, security_id, fund_id, side, strategy_id, ccy_id,
         quantity, cost, price_local, price_base,
         outstanding_shares, market_cap, tenant_id)
    SELECT
        holding_date,
        security_id,
        fund_id,
        side,
        strategy_id,
        ccy_id,
        SUM(quantity_end),
        SUM(cost_base),
        (array_agg(price_local ORDER BY id))[1],
        (array_agg(price_base  ORDER BY id))[1],
        (array_agg(outstanding_shares ORDER BY id))[1],
        (array_agg(market_cap ORDER BY id))[1],
        :tenant_id
    FROM holdings
    WHERE holding_date = :holding_date
      AND tenant_id = :tenant_id
    GROUP BY holding_date, security_id, fund_id, side, strategy_id, ccy_id
""")

DELETE_SQL = text("""
    DELETE FROM positions
    WHERE position_date = :holding_date
      AND tenant_id = :tenant_id
""")


def build_and_insert_positions(
    session: Session,
    holding_date: date,
    tenant_id: str,
) -> int:
    """Delete existing positions for the date/tenant, then rebuild from holdings.

    All aggregation runs inside PostgreSQL so NUMERIC precision is preserved
    and no holdings data is loaded into Python memory.

    Returns the count of inserted positions.
    """
    # Delete existing positions (idempotent re-runs)
    result = session.execute(
        DELETE_SQL,
        {"holding_date": holding_date, "tenant_id": tenant_id},
    )
    deleted = result.rowcount
    if deleted:
        logger.info("Deleted %d existing positions for %s", deleted, holding_date)

    # Aggregate holdings -> positions in a single INSERT...SELECT
    result = session.execute(
        AGGREGATE_SQL,
        {"holding_date": holding_date, "tenant_id": tenant_id},
    )
    inserted = result.rowcount
    logger.info("Built %d positions from holdings for %s", inserted, holding_date)
    return inserted
