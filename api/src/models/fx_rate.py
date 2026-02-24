import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Index, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class FxRate(Base):
    __tablename__ = "fx_rates"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    rate_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    ref_currency_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("currencies.id"), nullable=False
    )
    currency_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("currencies.id"), nullable=False
    )

    direct: Mapped[Decimal] = mapped_column(Numeric(precision=28, scale=12), nullable=False)
    indirect: Mapped[Decimal] = mapped_column(Numeric(precision=28, scale=12), nullable=False)

    last_modified_by: Mapped[str | None] = mapped_column(String(30), nullable=True)
    last_modified_on: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    # Relationships
    ref_currency: Mapped["Currency"] = relationship(foreign_keys=[ref_currency_id])  # noqa: F821
    currency: Mapped["Currency"] = relationship(foreign_keys=[currency_id])  # noqa: F821
    tenant: Mapped["Tenant"] = relationship()  # noqa: F821
