import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class Security(Base):
    __tablename__ = "securities"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # Core fields
    symbol: Mapped[str | None] = mapped_column(String(50), nullable=True)
    security_des: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Generic identifiers (user-defined, e.g. CUSIP, ISIN, SEDOL or any other)
    id_1: Mapped[str | None] = mapped_column(String(50), nullable=True)
    id_2: Mapped[str | None] = mapped_column(String(50), nullable=True)
    id_3: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Geographic
    cntry_of_risk_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("countries.id"), nullable=True
    )
    cntry_of_domicile_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("countries.id"), nullable=True
    )

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Bond fields
    coupon: Mapped[Decimal | None] = mapped_column(Numeric(precision=10, scale=6), nullable=True)
    maturity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    issue_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    first_coupon_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    penultimate_coupon_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_update_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Foreign keys
    ccy_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("currencies.id"), nullable=True
    )
    country_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("countries.id"), nullable=True
    )
    security_subtype_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("security_subtypes.id"), nullable=True
    )
    asset_type_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("asset_types.id"), nullable=True
    )
    sector_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("sectors.id"), nullable=True
    )
    market_category_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("market_categories.id"), nullable=True
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()  # noqa: F821
    currency: Mapped["Currency"] = relationship()  # noqa: F821
    country: Mapped["Country"] = relationship(foreign_keys=[country_id])  # noqa: F821
    cntry_of_risk: Mapped["Country"] = relationship(foreign_keys=[cntry_of_risk_id])  # noqa: F821
    cntry_of_domicile: Mapped["Country"] = relationship(foreign_keys=[cntry_of_domicile_id])  # noqa: F821
    security_subtype: Mapped["SecuritySubType"] = relationship()  # noqa: F821
    asset_type: Mapped["AssetType"] = relationship()  # noqa: F821
    sector: Mapped["Sector"] = relationship()  # noqa: F821
    market_category: Mapped["MarketCategory"] = relationship()  # noqa: F821
