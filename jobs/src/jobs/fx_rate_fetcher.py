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


def _upsert_rates_for_tenant(
    session, tenant_id: str, rate_date: str, rates: dict[str, float],
    ccy_lookup: dict[str, int], usd_id: int,
) -> dict:
    """Upsert FX rates for a single tenant. Returns per-tenant summary."""
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

    return {"tenant_id": tenant_id, "inserted": inserted, "updated": updated, "skipped": skipped}


def fetch_and_upsert() -> dict:
    """Fetch latest USD rates and upsert into fx_rates for all tenants.

    Returns:
        dict with keys: date, tenants (list of per-tenant summaries)
    """
    data = _fetch_rates()
    rate_date = data["date"]
    rates: dict[str, float] = data["usd"]

    session = get_session()
    try:
        # Build currency code -> id lookup
        rows = session.execute(text("SELECT id, LOWER(ccy) AS ccy FROM currencies")).fetchall()
        ccy_lookup: dict[str, int] = {row.ccy: row.id for row in rows}

        # Find USD currency id as ref_currency_id for fx_rates table
        usd_id = ccy_lookup.get("usd")
        if not usd_id:
            raise RuntimeError("USD currency not found in currencies table")

        # Fetch all tenant IDs
        tenant_rows = session.execute(text("SELECT id FROM tenants")).fetchall()
        if not tenant_rows:
            raise RuntimeError("No tenants found in tenants table")

        tenant_summaries = []
        for tenant_row in tenant_rows:
            summary = _upsert_rates_for_tenant(
                session, str(tenant_row.id), rate_date, rates, ccy_lookup, usd_id,
            )
            tenant_summaries.append(summary)
            logger.info("FX rate upsert for tenant %s: %s", tenant_row.id, summary)

        session.commit()

        result = {"date": rate_date, "tenants": tenant_summaries}
        logger.info("FX rate upsert complete: %d tenants processed", len(tenant_summaries))
        return result

    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
