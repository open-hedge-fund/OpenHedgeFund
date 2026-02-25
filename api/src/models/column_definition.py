import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class ColumnDefinition(Base):
    __tablename__ = "column_definitions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    file_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("files.id"), nullable=False)
    column_name: Mapped[str] = mapped_column(String(255), nullable=False)
    table_mapping: Mapped[str] = mapped_column(String(255), nullable=False)
    column_mapping: Mapped[str] = mapped_column(String(255), nullable=False)
    date_format: Mapped[str | None] = mapped_column(String(50), nullable=True)
    validate_against: Mapped[str | None] = mapped_column(String(100), nullable=True)

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    file: Mapped["File"] = relationship(back_populates="column_definitions")  # noqa: F821
    tenant: Mapped["Tenant"] = relationship(back_populates="column_definitions")  # noqa: F821
