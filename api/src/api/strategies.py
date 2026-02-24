from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.strategy import Strategy
from src.models.user import User
from src.schemas.strategy import StrategyCreate, StrategySchema, StrategyUpdate

router = APIRouter(prefix="/strategies", tags=["strategies"])


@router.get("/", response_model=list[StrategySchema])
async def list_strategies(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Strategy)
    if not user.is_superuser:
        query = query.where(Strategy.tenant_id == user.tenant_id)
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=StrategySchema, status_code=201)
async def create_strategy(
    data_in: StrategyCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = Strategy(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=StrategySchema)
async def get_strategy(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Strategy).where(Strategy.id == item_id)
    if not user.is_superuser:
        query = query.where(Strategy.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return obj


@router.patch("/{item_id}", response_model=StrategySchema)
async def update_strategy(
    item_id: int,
    data_in: StrategyUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Strategy).where(Strategy.id == item_id)
    if not user.is_superuser:
        query = query.where(Strategy.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Strategy not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_strategy(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Strategy).where(Strategy.id == item_id)
    if not user.is_superuser:
        query = query.where(Strategy.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Strategy not found")
    await session.delete(obj)
    await session.commit()
