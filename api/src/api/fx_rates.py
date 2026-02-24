from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.fx_rate import FxRate
from src.models.user import User
from src.schemas.fx_rate import FxRateCreate, FxRateSchema, FxRateUpdate

router = APIRouter(prefix="/fx-rates", tags=["fx-rates"])


@router.get("/dates", response_model=list[date])
async def list_fx_rate_dates(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """Return distinct rate dates in descending order."""
    query = select(func.distinct(FxRate.rate_date))
    if not user.is_superuser:
        query = query.where(FxRate.tenant_id == user.tenant_id)
    query = query.order_by(FxRate.rate_date.desc())
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/", response_model=list[FxRateSchema])
async def list_fx_rates(
    skip: int = 0,
    limit: int = 500,
    rate_date: date | None = Query(None),
    ref_currency_id: int | None = Query(None),
    currency_id: int | None = Query(None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(FxRate)
    if not user.is_superuser:
        query = query.where(FxRate.tenant_id == user.tenant_id)
    if rate_date:
        query = query.where(FxRate.rate_date == rate_date)
    if ref_currency_id:
        query = query.where(FxRate.ref_currency_id == ref_currency_id)
    if currency_id:
        query = query.where(FxRate.currency_id == currency_id)
    query = query.order_by(FxRate.rate_date.desc())
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=FxRateSchema, status_code=201)
async def create_fx_rate(
    data_in: FxRateCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = FxRate(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=FxRateSchema)
async def get_fx_rate(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(FxRate).where(FxRate.id == item_id)
    if not user.is_superuser:
        query = query.where(FxRate.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="FX rate not found")
    return obj


@router.patch("/{item_id}", response_model=FxRateSchema)
async def update_fx_rate(
    item_id: int,
    data_in: FxRateUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(FxRate).where(FxRate.id == item_id)
    if not user.is_superuser:
        query = query.where(FxRate.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="FX rate not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_fx_rate(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(FxRate).where(FxRate.id == item_id)
    if not user.is_superuser:
        query = query.where(FxRate.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="FX rate not found")
    await session.delete(obj)
    await session.commit()
