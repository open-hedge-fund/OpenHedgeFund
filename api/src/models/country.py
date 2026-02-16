import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class Country(Base):
    __tablename__ = "countries"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    country_code: Mapped[str] = mapped_column(String(30), nullable=False)
    country_desc: Mapped[str] = mapped_column(String(100), nullable=False)
    country_code_iso_alpha3: Mapped[str | None] = mapped_column(String(3), nullable=True)
    geographic_region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    continent: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    tenant: Mapped["Tenant"] = relationship()  # noqa: F821
