import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, CheckConstraint, Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class Holding(Base):
    __tablename__ = "holdings"
    __table_args__ = (
        CheckConstraint("side IN ('Long', 'Short')", name="holding_side_check"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    holding_date: Mapped[date] = mapped_column(Date, nullable=False)
    security_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("securities.id"), nullable=False
    )
    fund_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("funds.id"), nullable=True
    )
    custodian_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("custodians.id"), nullable=True
    )
    broker_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("brokers.id"), nullable=True
    )
    strategy_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("strategies.id"), nullable=True
    )
    ccy_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("currencies.id"), nullable=True
    )
    country_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("countries.id"), nullable=True
    )
    asset_type_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("asset_types.id"), nullable=True
    )
    side: Mapped[str] = mapped_column(String(5), nullable=False)  # 'Long' or 'Short'

    # Numeric fields
    quantity_start: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=6), nullable=True)
    quantity_end: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=6), nullable=True)
    cost_local: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=2), nullable=True)
    cost_base: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=2), nullable=True)
    price_local: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=6), nullable=True)
    price_base: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=6), nullable=True)
    outstanding_shares: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=0), nullable=True)
    market_cap: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=2), nullable=True)

    # Metadata
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
    fund: Mapped["Fund | None"] = relationship()  # noqa: F821
    custodian: Mapped["Custodian | None"] = relationship()  # noqa: F821
    broker: Mapped["Broker | None"] = relationship()  # noqa: F821
    strategy: Mapped["Strategy | None"] = relationship()  # noqa: F821
    currency: Mapped["Currency | None"] = relationship()  # noqa: F821
    country: Mapped["Country | None"] = relationship()  # noqa: F821
    asset_type: Mapped["AssetType | None"] = relationship()  # noqa: F821
    tenant: Mapped["Tenant"] = relationship()  # noqa: F821
