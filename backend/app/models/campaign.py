import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.domain import Domain


class Campaign(BaseModel):
    __tablename__ = "campaigns"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    customers: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="campaigns")
    domains: Mapped[List["Domain"]] = relationship(
        "Domain", back_populates="campaign"
    )
