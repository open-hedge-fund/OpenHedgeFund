"""Deletes and re-inserts positions for a given date and tenant (idempotent)."""

import logging
from datetime import date

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

POSITIONS_COLUMNS = [
    "position_date",
    "security_id",
    "fund_id",
    "side",
    "strategy_id",
    "ccy_id",
    "quantity",
    "cost",
    "price_local",
    "price_base",
    "outstanding_shares",
    "market_cap",
    "tenant_id",
]


def insert_positions(
    positions_df: pd.DataFrame,
    session: Session,
    holding_date: date,
    tenant_id: str,
) -> int:
    """Delete existing positions for the date/tenant then bulk insert new ones.

    Returns the count of inserted rows.
    """
    if positions_df.empty:
        return 0

    # Delete existing positions for this date + tenant (idempotent re-runs)
    result = session.execute(
        text("""
            DELETE FROM positions
            WHERE position_date = :position_date
              AND tenant_id = :tenant_id
        """),
        {"position_date": holding_date, "tenant_id": tenant_id},
    )
    deleted = result.rowcount
    if deleted:
        logger.info("Deleted %d existing positions for %s", deleted, holding_date)

    # Build row dicts, converting NaN to None
    rows: list[dict] = []
    for _, row in positions_df.iterrows():
        record = {}
        for col in POSITIONS_COLUMNS:
            val = row.get(col)
            if pd.isna(val):
                record[col] = None
            else:
                record[col] = val
        rows.append(record)

    placeholders = ", ".join(f":{col}" for col in POSITIONS_COLUMNS)
    col_list = ", ".join(POSITIONS_COLUMNS)

    session.execute(
        text(f"INSERT INTO positions ({col_list}) VALUES ({placeholders})"),
        rows,
    )

    logger.info("Inserted %d positions for %s", len(rows), holding_date)
    return len(rows)
