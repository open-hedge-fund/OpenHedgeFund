import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class StagingHolding(Base):
    __tablename__ = "staging_holdings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # Core holding fields
    account: Mapped[str | None] = mapped_column(String(50), nullable=True)
    account_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    symbol: Mapped[str | None] = mapped_column(String(50), nullable=True)
    security_description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    issuing_country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    local_currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    asset_class: Mapped[str | None] = mapped_column(String(50), nullable=True)
    side: Mapped[str | None] = mapped_column(String(10), nullable=True)  # L/S (Long/Short)

    # Numeric fields
    quantity: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=6), nullable=True)
    cost: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=2), nullable=True)
    price_local: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=6), nullable=True)
    price_base: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=6), nullable=True)
    outstanding_shares: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=0), nullable=True)
    market_cap: Mapped[Decimal | None] = mapped_column(Numeric(precision=18, scale=2), nullable=True)

    # Identifiers
    underlier: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sedol: Mapped[str | None] = mapped_column(String(7), nullable=True)
    isin: Mapped[str | None] = mapped_column(String(12), nullable=True)
    cusip: Mapped[str | None] = mapped_column(String(9), nullable=True)

    # Metadata
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False
    )
    file_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("files.id"), nullable=True
    )
    row_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    runid: Mapped[str | None] = mapped_column(String(100), nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()  # noqa: F821
    file: Mapped["File"] = relationship()  # noqa: F821
