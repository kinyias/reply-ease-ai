import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.domain import Domain


class HelpDesk(BaseModel):
    __tablename__ = "help_desks"

    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)

    domain_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("domains.id", ondelete="CASCADE"),
        nullable=True,
    )

    # Relationship
    domain: Mapped[Optional["Domain"]] = relationship(
        "Domain", back_populates="helpdesk"
    )
