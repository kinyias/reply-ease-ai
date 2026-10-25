from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.billing import Billings
    from app.models.domain import Domain
    from app.models.campaign import Campaign
    from app.models.payment_transaction import PaymentTransaction


class User(BaseModel):
    __tablename__ = "users"

    fullname: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="owner", nullable=False)

    # SePay Merchant Configuration
    sepay_merchant_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    sepay_secret_key: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )

    # Relationships
    subscription: Mapped[Optional["Billings"]] = relationship(
        "Billings",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    domains: Mapped[List["Domain"]] = relationship(
        "Domain",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    campaigns: Mapped[List["Campaign"]] = relationship(
        "Campaign",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    transactions: Mapped[List["PaymentTransaction"]] = relationship(
        "PaymentTransaction",
        back_populates="user",
        lazy="selectin",
    )
