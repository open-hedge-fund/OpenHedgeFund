from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.staging_holding import StagingHolding
from src.models.user import User
from src.schemas.staging_holding import StagingHoldingCreate, StagingHoldingSchema, StagingHoldingUpdate

router = APIRouter(prefix="/staging-holdings", tags=["staging-holdings"])


@router.get("/", response_model=list[StagingHoldingSchema])
async def list_staging_holdings(
    skip: int = 0,
    limit: int = 500,
    runid: str | None = Query(None),
    file_id: int | None = Query(None),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(StagingHolding)
    if not user.is_superuser:
        query = query.where(StagingHolding.tenant_id == user.tenant_id)
    if runid:
        query = query.where(StagingHolding.runid == runid)
    if file_id:
        query = query.where(StagingHolding.file_id == file_id)
    query = query.order_by(StagingHolding.id)
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=StagingHoldingSchema, status_code=201)
async def create_staging_holding(
    data_in: StagingHoldingCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    data = data_in.model_dump()
    data["tenant_id"] = user.tenant_id
    obj = StagingHolding(**data)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.post("/bulk", response_model=list[StagingHoldingSchema], status_code=201)
async def create_staging_holdings_bulk(
    data_in: list[StagingHoldingCreate],
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    objects = []
    for item in data_in:
        data = item.model_dump()
        data["tenant_id"] = user.tenant_id
        objects.append(StagingHolding(**data))
    session.add_all(objects)
    await session.commit()
    for obj in objects:
        await session.refresh(obj)
    return objects


@router.get("/{item_id}", response_model=StagingHoldingSchema)
async def get_staging_holding(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(StagingHolding).where(StagingHolding.id == item_id)
    if not user.is_superuser:
        query = query.where(StagingHolding.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Staging holding not found")
    return obj


@router.patch("/{item_id}", response_model=StagingHoldingSchema)
async def update_staging_holding(
    item_id: int,
    data_in: StagingHoldingUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(StagingHolding).where(StagingHolding.id == item_id)
    if not user.is_superuser:
        query = query.where(StagingHolding.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Staging holding not found")
    for key, value in data_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_staging_holding(
    item_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(StagingHolding).where(StagingHolding.id == item_id)
    if not user.is_superuser:
        query = query.where(StagingHolding.tenant_id == user.tenant_id)
    result = await session.execute(query)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Staging holding not found")
    await session.delete(obj)
    await session.commit()
