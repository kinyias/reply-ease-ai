import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.domain import Domain


class Bookings(BaseModel):
    __tablename__ = "bookings"

    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    slot: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)

    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), nullable=True
    )
    domain_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("domains.id", ondelete="CASCADE"), nullable=True
    )

    # Relationships
    customer: Mapped[Optional["Customer"]] = relationship(
        "Customer", back_populates="bookings"
    )
    domain: Mapped[Optional["Domain"]] = relationship(
        "Domain", back_populates="bookings"
    )
