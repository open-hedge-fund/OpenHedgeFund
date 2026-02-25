from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, case, literal
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.country import Country
from src.models.position import Position
from src.models.security import Security
from src.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/country-exposure")
async def country_exposure(
    position_date: date = Query(...),
    fund_id: int | None = Query(None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    long_exp = func.coalesce(
        func.sum(
            case(
                (Position.side == "Long", Position.quantity * Position.price_base),
                else_=literal(0),
            )
        ),
        0,
    )
    short_exp = func.coalesce(
        func.sum(
            case(
                (Position.side == "Short", Position.quantity * Position.price_base),
                else_=literal(0),
            )
        ),
        0,
    )

    query = (
        select(
            func.coalesce(Country.country_desc, "Unassigned").label("country"),
            long_exp.label("long_exposure"),
            short_exp.label("short_exposure"),
        )
        .select_from(Position)
        .join(Security, Position.security_id == Security.id)
        .outerjoin(Country, Security.country_id == Country.id)
        .where(Position.position_date == position_date)
        .where(Position.tenant_id == user.tenant_id)
        .group_by(Country.id, Country.country_desc)
    )

    if fund_id is not None:
        query = query.where(Position.fund_id == fund_id)

    result = await session.execute(query)
    rows = result.all()

    data = []
    total_long = 0.0
    total_short = 0.0

    for row in rows:
        long_val = float(row.long_exposure)
        short_val = float(row.short_exposure)
        gross_val = abs(long_val) + abs(short_val)
        net_val = long_val + short_val
        data.append({
            "country": row.country,
            "long_exposure": round(long_val, 2),
            "short_exposure": round(short_val, 2),
            "gross_exposure": round(gross_val, 2),
            "net_exposure": round(net_val, 2),
        })
        total_long += long_val
        total_short += short_val

    data.sort(key=lambda x: x["gross_exposure"], reverse=True)

    data.append({
        "country": "Total",
        "long_exposure": round(total_long, 2),
        "short_exposure": round(total_short, 2),
        "gross_exposure": round(abs(total_long) + abs(total_short), 2),
        "net_exposure": round(total_long + total_short, 2),
    })

    return data
