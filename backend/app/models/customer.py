import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.domain import Domain
    from app.models.customer_response import CustomerResponses
    from app.models.chatroom import ChatRoom
    from app.models.booking import Bookings
    from app.models.payment_transaction import PaymentTransaction


class Customer(BaseModel):
    __tablename__ = "customers"

    email: Mapped[Optional[str]] = mapped_column(
        String(255), index=True, nullable=True
    )
    domain_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("domains.id", ondelete="CASCADE"), nullable=True
    )

    # Relationships
    domain: Mapped[Optional["Domain"]] = relationship(
        "Domain", back_populates="customers"
    )
    questions: Mapped[List["CustomerResponses"]] = relationship(
        "CustomerResponses",
        back_populates="customer",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    chat_rooms: Mapped[List["ChatRoom"]] = relationship(
        "ChatRoom",
        back_populates="customer",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    bookings: Mapped[List["Bookings"]] = relationship(
        "Bookings",
        back_populates="customer",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    transactions: Mapped[List["PaymentTransaction"]] = relationship(
        "PaymentTransaction",
        back_populates="customer",
        lazy="selectin",
    )
