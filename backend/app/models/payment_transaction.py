import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Enum as SQLEnum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel
from app.models.enums import PaymentStatus, PaymentType

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.customer import Customer
    from app.models.domain import Domain


class PaymentTransaction(BaseModel):
    __tablename__ = "payment_transactions"

    order_code: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # VND
    payment_type: Mapped[PaymentType] = mapped_column(
        SQLEnum(PaymentType, name="payment_type_enum", native_enum=False),
        nullable=False,
    )
    status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus, name="payment_status_enum", native_enum=False),
        default=PaymentStatus.PENDING,
        nullable=False,
    )
    content: Mapped[str] = mapped_column(String(255), nullable=False)
    sepay_transaction_id: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("customers.id", ondelete="SET NULL"), nullable=True
    )
    domain_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("domains.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="transactions"
    )
    customer: Mapped[Optional["Customer"]] = relationship(
        "Customer", back_populates="transactions"
    )
    domain: Mapped[Optional["Domain"]] = relationship(
        "Domain", back_populates="transactions"
    )
