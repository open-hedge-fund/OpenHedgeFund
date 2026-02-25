from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/country-exposure")
async def country_exposure(
    position_date: date = Query(...),
    fund_id: int | None = Query(None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    params: dict = {
        "position_date": position_date,
        "tenant_id": user.tenant_id,
    }

    fund_filter = ""
    if fund_id is not None:
        fund_filter = "AND p.fund_id = :fund_id"
        params["fund_id"] = fund_id

    sql = text(f"""
        SELECT
            COALESCE(c.country_desc, 'Unassigned') AS country,
            p.side,
            SUM(p.quantity * p.price_base) AS exposure
        FROM positions p
        JOIN securities s ON p.security_id = s.id
        LEFT JOIN countries c ON s.country_id = c.id
        WHERE p.position_date = :position_date
          AND p.tenant_id = :tenant_id
          {fund_filter}
        GROUP BY c.country_desc, p.side
        ORDER BY c.country_desc
    """)

    result = await session.execute(sql, params)
    rows = result.fetchall()

    # Pivot rows into per-country objects
    country_map: dict[str, dict] = {}
    for row in rows:
        country = row.country
        if country not in country_map:
            country_map[country] = {
                "country": country,
                "long_exposure": 0.0,
                "short_exposure": 0.0,
            }
        exposure = float(row.exposure or 0)
        if row.side == "Long":
            country_map[country]["long_exposure"] = exposure
        else:
            country_map[country]["short_exposure"] = exposure

    # Calculate gross/net and build result list
    items = []
    total_long = 0.0
    total_short = 0.0
    for entry in country_map.values():
        long_exp = entry["long_exposure"]
        short_exp = entry["short_exposure"]
        gross = abs(long_exp) + abs(short_exp)
        net = long_exp + short_exp
        entry["gross_exposure"] = gross
        entry["net_exposure"] = net
        total_long += long_exp
        total_short += short_exp
        items.append(entry)

    # Sort by gross exposure descending
    items.sort(key=lambda x: x["gross_exposure"], reverse=True)

    # Append totals row
    items.append({
        "country": "Total",
        "long_exposure": total_long,
        "short_exposure": total_short,
        "gross_exposure": abs(total_long) + abs(total_short),
        "net_exposure": total_long + total_short,
    })

    return items
