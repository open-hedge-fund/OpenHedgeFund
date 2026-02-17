from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.position import Position
from src.models.user import User
from src.schemas.position import PositionCreate, PositionSchema, PositionUpdate

router = APIRouter(prefix="/positions", tags=["positions"])


@router.get("/", response_model=list[PositionSchema])
async def list_positions(
    skip: int = 0,
    limit: int = 500,
    position_date: date | None = Query(None),
    security_id: int | None = Query(None),
    fund_id: int | None = Query(None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Position)
    if not user.is_superuser:
        query = query.where(Position.tenant_id == user.tenant_id)
    if position_date:
        query = query.where(Position.position_date == position_date)
    if security_id:
        query = query.where(Position.security_id == security_id)
    if fund_id:
        query = query.where(Position.fund_id == fund_id)
    query = query.order_by(Position.position_date.desc(), Position.security_id)
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=PositionSchema, status_code=201)
async def create_position(
    data_in: PositionCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = Position(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.post("/bulk", response_model=list[PositionSchema], status_code=201)
async def create_positions_bulk(
    data_in: list[PositionCreate],
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    objects = []
    for item in data_in:
        data = item.model_dump()
        data["tenant_id"] = user.tenant_id
        objects.append(Position(**data))
    session.add_all(objects)
    await session.commit()
    for obj in objects:
        await session.refresh(obj)
    return objects


@router.get("/{item_id}", response_model=PositionSchema)
async def get_position(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Position).where(Position.id == item_id)
    if not user.is_superuser:
        query = query.where(Position.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Position not found")
    return obj


@router.patch("/{item_id}", response_model=PositionSchema)
async def update_position(
    item_id: int,
    data_in: PositionUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Position).where(Position.id == item_id)
    if not user.is_superuser:
        query = query.where(Position.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Position not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_position(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Position).where(Position.id == item_id)
    if not user.is_superuser:
        query = query.where(Position.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Position not found")
    await session.delete(obj)
    await session.commit()
