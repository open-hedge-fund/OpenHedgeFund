from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.fund import Fund
from src.models.user import User
from src.schemas.fund import FundCreate, FundSchema, FundUpdate

router = APIRouter(prefix="/funds", tags=["funds"])


@router.get("/", response_model=list[FundSchema])
async def list_funds(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Fund)
        .where(Fund.tenant_id == user.tenant_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=FundSchema, status_code=201)
async def create_fund(
    data_in: FundCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = Fund(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get("/{item_id}", response_model=FundSchema)
async def get_fund(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Fund)
        .where(Fund.id == item_id)
        .where(Fund.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Fund not found")
    return obj


@router.patch("/{item_id}", response_model=FundSchema)
async def update_fund(
    item_id: int,
    data_in: FundUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Fund)
        .where(Fund.id == item_id)
        .where(Fund.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Fund not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_fund(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Fund)
        .where(Fund.id == item_id)
        .where(Fund.tenant_id == user.tenant_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Fund not found")
    await session.delete(obj)
    await session.commit()
