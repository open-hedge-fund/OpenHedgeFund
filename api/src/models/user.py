import enum
import uuid

from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID
from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base
from src.models.tenant import Tenant


class TenantRole(str, enum.Enum):
    member = "member"
    admin = "admin"


class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False
    )
    first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(
        Enum(TenantRole, native_enum=False, values_callable=lambda e: [x.value for x in e]),
        default="admin",
        server_default="admin",
        nullable=False,
    )

    tenant: Mapped[Tenant] = relationship(back_populates="users")
