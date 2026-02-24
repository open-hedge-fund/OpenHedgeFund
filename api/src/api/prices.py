from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.price import Price
from src.models.user import User
from src.schemas.price import PriceCreate, PriceSchema, PriceUpdate

router = APIRouter(prefix="/prices", tags=["prices"])


@router.get("/", response_model=list[PriceSchema])
async def list_prices(
    skip: int = 0,
    limit: int = 500,
    price_date: date | None = Query(None),
    security_id: int | None = Query(None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Price)
    if not user.is_superuser:
        query = query.where(Price.tenant_id == user.tenant_id)
    if price_date:
        query = query.where(Price.price_date == price_date)
    if security_id:
        query = query.where(Price.security_id == security_id)
    query = query.order_by(Price.price_date.desc(), Price.security_id)
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=PriceSchema, status_code=201)
async def create_price(
    data_in: PriceCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = Price(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=PriceSchema)
async def get_price(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Price).where(Price.id == item_id)
    if not user.is_superuser:
        query = query.where(Price.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Price not found")
    return obj


@router.patch("/{item_id}", response_model=PriceSchema)
async def update_price(
    item_id: int,
    data_in: PriceUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Price).where(Price.id == item_id)
    if not user.is_superuser:
        query = query.where(Price.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Price not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_price(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Price).where(Price.id == item_id)
    if not user.is_superuser:
        query = query.where(Price.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Price not found")
    await session.delete(obj)
    await session.commit()
