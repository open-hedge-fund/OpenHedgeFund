"""Fetch daily USD exchange rates and upsert into fx_rates table."""

import logging
from datetime import datetime, timezone
from decimal import Decimal

import httpx
from sqlalchemy import text

from src.database import get_session

logger = logging.getLogger(__name__)

PRIMARY_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
FALLBACK_URL = "https://latest.currency-api.pages.dev/v1/currencies/usd.json"


def _fetch_rates() -> dict:
    """Fetch USD exchange rates from the free currency API with fallback."""
    for url in (PRIMARY_URL, FALLBACK_URL):
        try:
            resp = httpx.get(url, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except Exception:
            logger.warning("Failed to fetch from %s, trying fallback...", url)
    raise RuntimeError("Failed to fetch FX rates from all sources")


def fetch_and_upsert() -> dict:
    """Fetch latest USD rates and upsert into fx_rates.

    Returns:
        dict with keys: date, inserted, updated, skipped
    """
    data = _fetch_rates()
    rate_date = data["date"]

    # pull out the nested "usd" dictionary for convenience.
    rates: dict[str, float] = data["usd"]

    session = get_session()
    try:
        # Build currency code -> id lookup
        rows = session.execute(text("SELECT id, LOWER(ccy) AS ccy FROM currencies")).fetchall()
        ccy_lookup: dict[str, int] = {row.ccy: row.id for row in rows}

        # Find USD currency id as ref_currency_id
        # Note:  The API gives us rates relative to USD, but the database doesn't store "USD" as a string 
        # — it needs USD's integer id from the currencies table. That's what usd_id is for: it gets written into every row as the ref_currency_id.
        """
             rate_date  | ref_currency_id | currency_id |      direct       |    indirect    |              tenant_id
            ------------+-----------------+-------------+-------------------+----------------+--------------------------------------
            2026-02-18 |             142 |           2 |    3.672500000000 | 0.272294077604 | 8dfdb30a-3001-43ed-b65c-03186d59fa10
            2026-02-18 |             142 |           3 |   62.503054000000 | 0.015999218214 | 8dfdb30a-3001-43ed-b65c-03186d59fa10
        """
        usd_id = ccy_lookup.get("usd")
        if not usd_id:
            raise RuntimeError("USD currency not found in currencies table")

        # Find default tenant (first row)
        tenant_row = session.execute(text("SELECT id FROM tenants ORDER BY created_at LIMIT 1")).fetchone()
        if not tenant_row:
            raise RuntimeError("No tenant found in tenants table")
        tenant_id = tenant_row.id

        now = datetime.now(timezone.utc)
        inserted = 0
        updated = 0
        skipped = 0

        for code, rate_value in rates.items():
            currency_id = ccy_lookup.get(code.lower())
            if not currency_id:
                skipped += 1
                continue
            if currency_id == usd_id:
                continue

            direct = Decimal(str(rate_value))
            indirect = Decimal("1") / direct if direct else Decimal("0")

            result = session.execute(
                text("""
                    INSERT INTO fx_rates
                        (rate_date, ref_currency_id, currency_id, direct, indirect,
                         last_modified_by, last_modified_on, tenant_id)
                    VALUES
                        (:rate_date, :ref_currency_id, :currency_id, :direct, :indirect,
                         :last_modified_by, :last_modified_on, :tenant_id)
                    ON CONFLICT (rate_date, ref_currency_id, currency_id, tenant_id)
                    DO UPDATE SET
                        direct = EXCLUDED.direct,
                        indirect = EXCLUDED.indirect,
                        last_modified_by = EXCLUDED.last_modified_by,
                        last_modified_on = EXCLUDED.last_modified_on,
                        updated_at = now()
                    RETURNING (xmax = 0) AS was_insert
                """),
                {
                    "rate_date": rate_date,
                    "ref_currency_id": usd_id,
                    "currency_id": currency_id,
                    "direct": direct,
                    "indirect": indirect,
                    "last_modified_by": "system",
                    "last_modified_on": now,
                    "tenant_id": tenant_id,
                },
            )

            row = result.fetchone()
            if row.was_insert:
                inserted += 1
            else:
                updated += 1

        session.commit()

        summary = {
            "date": rate_date,
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
        }
        logger.info("FX rate upsert complete: %s", summary)
        return summary

    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
