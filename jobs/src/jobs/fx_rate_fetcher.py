"""Fetch daily USD exchange rates and upsert into fx_rates table."""

import logging
from datetime import datetime, timezone
from decimal import Decimal

import httpx
from sqlalchemy import text

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


def _prepare_rate_rows(
    rates: dict[str, float],
    ccy_lookup: dict[str, int],
    usd_id: int,
) -> tuple[list[dict], int]:
    """Filter and compute rate rows from API data.

    Returns:
        Tuple of (list of rate param dicts, skipped count).
    """
    rows = []
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
        rows.append(
            {
                "currency_id": currency_id,
                "direct": direct,
                "indirect": indirect,
            }
        )

    return rows, skipped


def _bulk_upsert(
    session,
    rate_date: str,
    usd_id: int,
    rate_rows: list[dict],
) -> dict:
    """Bulk upsert FX rates for all tenants using a staging temp table.

    Returns:
        dict with total inserted and updated counts per tenant.
    """
    now = datetime.now(timezone.utc)

    # Create a temp table to stage the rate data
    session.execute(
        text("""
        CREATE TEMP TABLE _fx_staging (
            currency_id BIGINT,
            direct NUMERIC(28, 12),
            indirect NUMERIC(28, 12)
        ) ON COMMIT DROP
    """)
    )

    # Bulk insert all rates into staging
    session.execute(
        text("""
            INSERT INTO _fx_staging (currency_id, direct, indirect)
            VALUES (:currency_id, :direct, :indirect)
        """),
        rate_rows,
    )

    # Cross-join staging with tenants and upsert into fx_rates in one query.
    # RETURNING tells us per-tenant insert vs update counts.
    result = session.execute(
        text("""
            INSERT INTO fx_rates
                (rate_date, ref_currency_id, currency_id, direct, indirect,
                 last_modified_by, last_modified_on, tenant_id)
            SELECT
                :rate_date, :ref_currency_id, s.currency_id, s.direct, s.indirect,
                :last_modified_by, :last_modified_on, t.id
            FROM _fx_staging s
            CROSS JOIN tenants t
            ON CONFLICT (rate_date, ref_currency_id, currency_id, tenant_id)
            DO UPDATE SET
                direct = EXCLUDED.direct,
                indirect = EXCLUDED.indirect,
                last_modified_by = EXCLUDED.last_modified_by,
                last_modified_on = EXCLUDED.last_modified_on,
                updated_at = now()
            RETURNING tenant_id, (xmax = 0) AS was_insert
        """),
        {
            "rate_date": rate_date,
            "ref_currency_id": usd_id,
            "last_modified_by": "system",
            "last_modified_on": now,
        },
    )

    # Aggregate insert/update counts per tenant
    tenant_counts: dict[str, dict[str, int]] = {}
    for row in result.fetchall():
        tid = str(row.tenant_id)
        if tid not in tenant_counts:
            tenant_counts[tid] = {"inserted": 0, "updated": 0}
        if row.was_insert:
            tenant_counts[tid]["inserted"] += 1
        else:
            tenant_counts[tid]["updated"] += 1

    return tenant_counts


def fetch_and_upsert(session) -> dict:
    """Fetch latest USD rates and upsert into fx_rates for all tenants.

    Args:
        session: SQLAlchemy session provided by the caller (task layer).

    Returns:
        dict with keys: date, tenants (list of per-tenant summaries)
    """
    data = _fetch_rates()
    rate_date = data["date"]
    rates: dict[str, float] = data["usd"]

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

    # Prepare rate rows (filter by known currencies, compute direct/indirect)
    rate_rows, skipped = _prepare_rate_rows(rates, ccy_lookup, usd_id)

    if rate_rows:
        tenant_counts = _bulk_upsert(session, rate_date, usd_id, rate_rows)
    else:
        tenant_counts = {}

    # Build per-tenant summaries
    tenant_summaries = []
    for tenant_row in tenant_rows:
        tid = str(tenant_row.id)
        counts = tenant_counts.get(tid, {"inserted": 0, "updated": 0})
        summary = {
            "tenant_id": tid,
            "inserted": counts["inserted"],
            "updated": counts["updated"],
            "skipped": skipped,
        }
        tenant_summaries.append(summary)
        logger.info("FX rate upsert for tenant %s: %s", tenant_row.id, summary)

    result = {"date": rate_date, "tenants": tenant_summaries}
    logger.info("FX rate upsert complete: %d tenants processed", len(tenant_summaries))
    return result
