import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel
from app.models.enums import Role

if TYPE_CHECKING:
    from app.models.chatroom import ChatRoom


class ChatMessage(BaseModel):
    __tablename__ = "chat_messages"

    message: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[Optional[Role]] = mapped_column(
        SQLEnum(Role, name="role_enum", native_enum=False),
        nullable=True,
    )
    seen: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    chat_room_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("chat_rooms.id", ondelete="CASCADE"),
        nullable=True,
    )

    # Relationship
    chat_room: Mapped[Optional["ChatRoom"]] = relationship(
        "ChatRoom", back_populates="messages"
    )
