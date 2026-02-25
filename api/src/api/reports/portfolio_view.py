from datetime import date

import pandas as pd
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.asset_type import AssetType
from src.models.fund import Fund
from src.models.position import Position
from src.models.security import Security
from src.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])


def _build_section(df: pd.DataFrame, fund_label: str) -> dict:
    """Build a single fund section (or aggregated) from a DataFrame of positions."""
    # Derive columns
    df = df.copy()
    df["underlier"] = df.apply(
        lambda r: "Cash" if r["asset_type_code"] == "Cash" else r["symbol"], axis=1
    )
    df["market_value_local"] = df["quantity"] * df["price_local"]
    df["market_value_base"] = df["quantity"] * df["price_base"]

    # Group by underlier and aggregate
    grouped = df.groupby("underlier", sort=False).agg(
        last_price=("price_local", "first"),
        current_qty=("quantity", "sum"),
        market_value_base=("market_value_base", "sum"),
        market_value_local=("market_value_local", "sum"),
        cost_local=("cost_local", "sum"),
        cost_base=("cost_base", "sum"),
        security_description=("security_des", "first"),
        is_cash=("asset_type_code", lambda x: (x == "Cash").any()),
    ).reset_index()

    # Separate cash and non-cash
    cash_rows = grouped[grouped["is_cash"]].copy()
    non_cash_rows = grouped[~grouped["is_cash"]].copy()
    non_cash_rows = non_cash_rows.sort_values("underlier")

    # For cash rows: null out price/qty, set description
    cash_rows["last_price"] = None
    cash_rows["current_qty"] = None
    cash_rows["security_description"] = "Cash & Cash Equivalent"

    # Combine: cash first, then non-cash alphabetical
    ordered = pd.concat([cash_rows, non_cash_rows], ignore_index=True)

    # Portfolio total market value for pct_of_portfolio
    total_mv_base = ordered["market_value_base"].sum()

    rows = []
    for _, r in ordered.iterrows():
        mv_local = r["market_value_local"]
        c_local = r["cost_local"]
        mv_base = r["market_value_base"]
        c_base = r["cost_base"]

        unrealized_pl_pct = (mv_local / c_local - 1) if c_local and c_local != 0 else None
        unrealized_pl_base_pct = (mv_base / c_base - 1) if c_base and c_base != 0 else None
        pct_of_portfolio = (mv_base / total_mv_base) if total_mv_base and total_mv_base != 0 else None

        rows.append({
            "underlier": r["underlier"],
            "security_description": r["security_description"],
            "last_price": _round_or_none(r["last_price"], 2),
            "current_qty": _round_or_none(r["current_qty"], 0),
            "market_value_base": round(float(mv_base), 2),
            "cost_local": round(float(c_local), 2) if c_local else 0.0,
            "unrealized_pl_pct": _round_or_none(unrealized_pl_pct, 4),
            "cost_base": round(float(c_base), 2) if c_base else 0.0,
            "unrealized_pl_base_pct": _round_or_none(unrealized_pl_base_pct, 4),
            "pct_of_portfolio": _round_or_none(pct_of_portfolio, 4),
        })

    # Subtotal - Other Assets (non-cash only)
    non_cash_mv_base = non_cash_rows["market_value_base"].sum() if len(non_cash_rows) else 0
    non_cash_mv_local = non_cash_rows["market_value_local"].sum() if len(non_cash_rows) else 0
    non_cash_cost_local = non_cash_rows["cost_local"].sum() if len(non_cash_rows) else 0
    non_cash_cost_base = non_cash_rows["cost_base"].sum() if len(non_cash_rows) else 0

    subtotal_unrealized = (
        (non_cash_mv_local / non_cash_cost_local - 1)
        if non_cash_cost_local and non_cash_cost_local != 0
        else None
    )
    subtotal_unrealized_base = (
        (non_cash_mv_base / non_cash_cost_base - 1)
        if non_cash_cost_base and non_cash_cost_base != 0
        else None
    )
    subtotal_pct = (
        (non_cash_mv_base / total_mv_base) if total_mv_base and total_mv_base != 0 else None
    )

    subtotal_other_assets = {
        "market_value_base": round(float(non_cash_mv_base), 2),
        "cost_local": round(float(non_cash_cost_local), 2),
        "unrealized_pl_pct": _round_or_none(subtotal_unrealized, 4),
        "cost_base": round(float(non_cash_cost_base), 2),
        "unrealized_pl_base_pct": _round_or_none(subtotal_unrealized_base, 4),
        "pct_of_portfolio": _round_or_none(subtotal_pct, 4),
    }

    # Total - Portfolio
    total_cost_local = ordered["cost_local"].sum()
    total_cost_base = ordered["cost_base"].sum()
    total_mv_local = ordered["market_value_local"].sum()

    total_unrealized = (
        (total_mv_local / total_cost_local - 1)
        if total_cost_local and total_cost_local != 0
        else None
    )
    total_unrealized_base = (
        (total_mv_base / total_cost_base - 1)
        if total_cost_base and total_cost_base != 0
        else None
    )

    total_portfolio = {
        "market_value_base": round(float(total_mv_base), 2),
        "cost_local": round(float(total_cost_local), 2),
        "unrealized_pl_pct": _round_or_none(total_unrealized, 4),
        "cost_base": round(float(total_cost_base), 2),
        "unrealized_pl_base_pct": _round_or_none(total_unrealized_base, 4),
        "pct_of_portfolio": 1.0 if total_mv_base and total_mv_base != 0 else None,
    }

    return {
        "fund_code": fund_label,
        "rows": rows,
        "subtotal_other_assets": subtotal_other_assets,
        "total_portfolio": total_portfolio,
    }


def _round_or_none(val, decimals: int):
    if val is None or pd.isna(val):
        return None
    return round(float(val), decimals)


@router.get("/portfolio-view")
async def portfolio_view(
    position_date: date = Query(...),
    fund_id: int | None = Query(None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = (
        select(
            Position.quantity,
            Position.cost_local,
            Position.cost_base,
            Position.price_local,
            Position.price_base,
            Security.symbol,
            Security.security_des,
            AssetType.asset_type_code,
            Fund.fund_code,
        )
        .select_from(Position)
        .join(Security, Position.security_id == Security.id)
        .outerjoin(AssetType, Security.asset_type_id == AssetType.id)
        .outerjoin(Fund, Position.fund_id == Fund.id)
        .where(Position.position_date == position_date)
        .where(Position.tenant_id == user.tenant_id)
    )

    if fund_id is not None:
        query = query.where(Position.fund_id == fund_id)

    result = await session.execute(query)
    rows = result.all()

    if not rows:
        return {"sections": []}

    df = pd.DataFrame(rows, columns=[
        "quantity", "cost_local", "cost_base", "price_local", "price_base",
        "symbol", "security_des", "asset_type_code", "fund_code",
    ])

    # Convert Decimals to float for pandas operations
    for col in ["quantity", "cost_local", "cost_base", "price_local", "price_base"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    df["fund_code"] = df["fund_code"].fillna("Unassigned")
    df["asset_type_code"] = df["asset_type_code"].fillna("")

    sections = []

    # Per-fund sections (alphabetical by fund_code)
    fund_codes = sorted(df["fund_code"].unique())
    for fc in fund_codes:
        fund_df = df[df["fund_code"] == fc]
        sections.append(_build_section(fund_df, fc))

    # Aggregated Portfolios section (across all funds)
    if len(fund_codes) > 1:
        sections.append(_build_section(df, "Aggregated Portfolios"))

    return {"sections": sections}
