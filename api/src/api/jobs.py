from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import current_active_user
from src.database import get_async_session
from src.models.job import Job
from src.models.user import User
from src.schemas.job import JobCreate, JobSchema, JobUpdate

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/", response_model=list[JobSchema])
async def list_jobs(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Job)
    if not user.is_superuser:
        query = query.where(Job.tenant_id == user.tenant_id)
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=JobSchema, status_code=201)
async def create_job(
    job_in: JobCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    job_data = job_in.model_dump()
    job_data["tenant_id"] = user.tenant_id
    job = Job(**job_data)
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return job


@router.patch("/{job_id}", response_model=JobSchema)
async def update_job(
    job_id: int,
    job_in: JobUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Job).where(Job.id == job_id)
    if not user.is_superuser:
        query = query.where(Job.tenant_id == user.tenant_id)
    result = await session.execute(query)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    update_data = job_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(job, key, value)
    await session.commit()
    await session.refresh(job)
    return job


@router.delete("/{job_id}", status_code=204)
async def delete_job(
    job_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    query = select(Job).where(Job.id == job_id)
    if not user.is_superuser:
        query = query.where(Job.tenant_id == user.tenant_id)
    result = await session.execute(query)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await session.delete(job)
    await session.commit()
