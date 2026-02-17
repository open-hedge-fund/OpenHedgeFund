import enum
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class FileName(str, enum.Enum):
    PRICING = "Pricing"
    HOLDINGS = "Holdings"


class FileType(str, enum.Enum):
    CSV = "CSV"
    PIPE = "PIPE"


class File(Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(
        Enum(FileName, native_enum=False, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
    )
    type: Mapped[str] = mapped_column(
        Enum(FileType, native_enum=False, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
    )
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

    tenant: Mapped["Tenant"] = relationship(back_populates="files")  # noqa: F821
    imports: Mapped[list["FileImport"]] = relationship(back_populates="file")  # noqa: F821
    column_definitions: Mapped[list["ColumnDefinition"]] = relationship(back_populates="file")  # noqa: F821
