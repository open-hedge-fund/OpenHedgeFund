"""Aggregates holdings into positions for a given date and tenant."""

import logging
from datetime import date

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

POSITION_KEYS = [
    "holding_date",
    "security_id",
    "fund_id",
    "side",
    "strategy_id",
    "ccy_id",
]


def build_positions(
    session: Session,
    holding_date: date,
    tenant_id: str,
) -> pd.DataFrame:
    """Query all holdings for the date/tenant and aggregate into positions.

    Returns a DataFrame ready for insertion into the positions table.
    """
    result = session.execute(
        text("""
            SELECT holding_date, security_id, fund_id, side,
                   strategy_id, ccy_id,
                   quantity_end, cost_base,
                   price_local, price_base,
                   outstanding_shares, market_cap
            FROM holdings
            WHERE holding_date = :holding_date
              AND tenant_id = :tenant_id
        """),
        {"holding_date": holding_date, "tenant_id": tenant_id},
    )
    rows = result.mappings().all()

    if not rows:
        logger.info("No holdings found for %s / tenant %s", holding_date, tenant_id)
        return pd.DataFrame()

    holdings_df = pd.DataFrame(rows)
    logger.info(
        "Loaded %d holdings for %s to aggregate into positions",
        len(holdings_df),
        holding_date,
    )

    positions = (
        holdings_df.groupby(POSITION_KEYS, dropna=False)
        .agg(
            {
                "quantity_end": "sum",
                "cost_base": "sum",
                "price_local": "first",
                "price_base": "first",
                "outstanding_shares": "first",
                "market_cap": "first",
            }
        )
        .reset_index()
    )

    positions.rename(
        columns={
            "holding_date": "position_date",
            "quantity_end": "quantity",
            "cost_base": "cost",
        },
        inplace=True,
    )

    positions["tenant_id"] = tenant_id

    logger.info("Built %d positions from holdings", len(positions))
    return positions
