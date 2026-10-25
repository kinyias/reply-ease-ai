import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.chat_message import ChatMessage


class ChatRoom(BaseModel):
    __tablename__ = "chat_rooms"

    live: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    mailed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), nullable=True
    )

    # Relationships
    customer: Mapped[Optional["Customer"]] = relationship(
        "Customer", back_populates="chat_rooms"
    )
    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage",
        back_populates="chat_room",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at.asc()",
        lazy="selectin",
    )
