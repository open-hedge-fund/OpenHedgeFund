import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class SecurityType(Base):
    __tablename__ = "security_types"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    security_type_code: Mapped[str] = mapped_column(String(30), nullable=False)
    security_type_desc: Mapped[str] = mapped_column(String(100), nullable=False)
    settlement_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
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
    security_subtypes: Mapped[list["SecuritySubType"]] = relationship(back_populates="security_type")  # noqa: F821
