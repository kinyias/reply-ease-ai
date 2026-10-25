import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.domain import Domain


class FilterQuestions(BaseModel):
    __tablename__ = "filter_questions"

    question: Mapped[str] = mapped_column(Text, nullable=False)
    answered: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    domain_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("domains.id", ondelete="CASCADE"),
        nullable=True,
    )

    # Relationship
    domain: Mapped[Optional["Domain"]] = relationship(
        "Domain", back_populates="filter_questions"
    )
