import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class Price(Base):
    __tablename__ = "prices"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    price_date: Mapped[date] = mapped_column(Date, nullable=False)
    security_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("securities.id"), nullable=False
    )
    currency_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("currencies.id"), nullable=False
    )

    last: Mapped[Decimal] = mapped_column(Numeric(precision=28, scale=12), nullable=False)
    next_day_open: Mapped[Decimal | None] = mapped_column(
        Numeric(precision=28, scale=12), nullable=True
    )

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
    security: Mapped["Security"] = relationship()  # noqa: F821
    currency: Mapped["Currency"] = relationship()  # noqa: F821
    tenant: Mapped["Tenant"] = relationship()  # noqa: F821
