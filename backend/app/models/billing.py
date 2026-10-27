import uuid
from typing import TYPE_CHECKING
from sqlalchemy import Enum as SQLEnum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel
from app.models.enums import Plans

if TYPE_CHECKING:
    from app.models.user import User


class Billings(BaseModel):
    __tablename__ = "billings"

    plan: Mapped[Plans] = mapped_column(
        SQLEnum(Plans, name="plans_enum", native_enum=False),
        default=Plans.STANDARD,
        nullable=False,
    )
    credits: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="subscription")
