import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.core.permissions import require_superuser, require_tenant_admin
from src.database import get_async_session
from src.models.tenant import Tenant
from src.models.user import User
from src.schemas.tenant import TenantCreate, TenantSchema, TenantUpdate

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.get("/me", response_model=TenantSchema)
async def get_my_tenant(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.patch("/me", response_model=TenantSchema)
async def update_my_tenant(
    tenant_in: TenantUpdate,
    user: User = Depends(require_tenant_admin),
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    update_data = tenant_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)
    await session.commit()
    await session.refresh(tenant)
    return tenant


@router.get("/", response_model=list[TenantSchema])
async def list_tenants(
    user: User = Depends(require_superuser),
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Tenant))
    return result.scalars().all()


@router.post("/", response_model=TenantSchema, status_code=201)
async def create_tenant(
    tenant_in: TenantCreate,
    user: User = Depends(require_superuser),
    session: AsyncSession = Depends(get_async_session),
):
    tenant = Tenant(**tenant_in.model_dump())
    session.add(tenant)
    await session.commit()
    await session.refresh(tenant)
    return tenant


@router.patch("/{tenant_id}", response_model=TenantSchema)
async def update_tenant(
    tenant_id: uuid.UUID,
    tenant_in: TenantUpdate,
    user: User = Depends(require_superuser),
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    update_data = tenant_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)
    await session.commit()
    await session.refresh(tenant)
    return tenant


@router.delete("/{tenant_id}", status_code=204)
async def delete_tenant(
    tenant_id: uuid.UUID,
    user: User = Depends(require_superuser),
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    await session.delete(tenant)
    await session.commit()
