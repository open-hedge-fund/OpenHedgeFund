from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.holding import Holding
from src.models.user import User
from src.schemas.holding import HoldingCreate, HoldingSchema, HoldingUpdate

router = APIRouter(prefix="/holdings", tags=["holdings"])


@router.get("/", response_model=list[HoldingSchema])
async def list_holdings(
    skip: int = 0,
    limit: int = 500,
    holding_date: date | None = Query(None),
    security_id: int | None = Query(None),
    fund_id: int | None = Query(None),
    custodian_id: int | None = Query(None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Holding)
    if not user.is_superuser:
        query = query.where(Holding.tenant_id == user.tenant_id)
    if holding_date:
        query = query.where(Holding.holding_date == holding_date)
    if security_id:
        query = query.where(Holding.security_id == security_id)
    if fund_id:
        query = query.where(Holding.fund_id == fund_id)
    if custodian_id:
        query = query.where(Holding.custodian_id == custodian_id)
    query = query.order_by(Holding.holding_date.desc(), Holding.security_id)
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=HoldingSchema, status_code=201)
async def create_holding(
    data_in: HoldingCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = Holding(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.post("/bulk", response_model=list[HoldingSchema], status_code=201)
async def create_holdings_bulk(
    data_in: list[HoldingCreate],
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    objects = []
    for item in data_in:
        data = item.model_dump()
        data["tenant_id"] = user.tenant_id
        objects.append(Holding(**data))
    session.add_all(objects)
    await session.commit()
    for obj in objects:
        await session.refresh(obj)
    return objects


@router.get("/{item_id}", response_model=HoldingSchema)
async def get_holding(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Holding).where(Holding.id == item_id)
    if not user.is_superuser:
        query = query.where(Holding.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Holding not found")
    return obj


@router.patch("/{item_id}", response_model=HoldingSchema)
async def update_holding(
    item_id: int,
    data_in: HoldingUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Holding).where(Holding.id == item_id)
    if not user.is_superuser:
        query = query.where(Holding.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Holding not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_holding(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Holding).where(Holding.id == item_id)
    if not user.is_superuser:
        query = query.where(Holding.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Holding not found")
    await session.delete(obj)
    await session.commit()
