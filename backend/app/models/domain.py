import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.campaign import Campaign
    from app.models.chatbot import ChatBot
    from app.models.helpdesk import HelpDesk
    from app.models.filter_question import FilterQuestions
    from app.models.product import Product
    from app.models.customer import Customer
    from app.models.booking import Bookings
    from app.models.payment_transaction import PaymentTransaction
    from app.models.knowledge_document import KnowledgeDocument


class Domain(BaseModel):
    __tablename__ = "domains"

    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    icon: Mapped[str] = mapped_column(String(500), nullable=False)

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="domains")
    campaign: Mapped[Optional["Campaign"]] = relationship(
        "Campaign", back_populates="domains"
    )
    chat_bot: Mapped[Optional["ChatBot"]] = relationship(
        "ChatBot",
        back_populates="domain",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    helpdesk: Mapped[List["HelpDesk"]] = relationship(
        "HelpDesk",
        back_populates="domain",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    filter_questions: Mapped[List["FilterQuestions"]] = relationship(
        "FilterQuestions",
        back_populates="domain",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    products: Mapped[List["Product"]] = relationship(
        "Product",
        back_populates="domain",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    customers: Mapped[List["Customer"]] = relationship(
        "Customer",
        back_populates="domain",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    bookings: Mapped[List["Bookings"]] = relationship(
        "Bookings", back_populates="domain", lazy="selectin"
    )
    transactions: Mapped[List["PaymentTransaction"]] = relationship(
        "PaymentTransaction", back_populates="domain", lazy="selectin"
    )
    knowledge_documents: Mapped[List["KnowledgeDocument"]] = relationship(
        "KnowledgeDocument",
        back_populates="domain",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="KnowledgeDocument.created_at.desc()",
    )
