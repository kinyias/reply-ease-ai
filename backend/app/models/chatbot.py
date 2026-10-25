import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.domain import Domain


class ChatBot(BaseModel):
    __tablename__ = "chat_bots"

    welcome_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        default="Hey there, have a question? Text us here",
    )
    icon: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    background: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    text_color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    helpdesk: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    domain_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("domains.id", ondelete="CASCADE"),
        unique=True,
        nullable=True,
    )

    # Relationship
    domain: Mapped[Optional["Domain"]] = relationship(
        "Domain", back_populates="chat_bot"
    )
