import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.customer import Customer


class CustomerResponses(BaseModel):
    __tablename__ = "customer_responses"

    question: Mapped[str] = mapped_column(Text, nullable=False)
    answered: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationship
    customer: Mapped["Customer"] = relationship(
        "Customer", back_populates="questions"
    )
