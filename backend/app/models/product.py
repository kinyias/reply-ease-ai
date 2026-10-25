import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.domain import Domain


class Product(BaseModel):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)  # Giá VND
    image: Mapped[str] = mapped_column(String(500), nullable=False)

    domain_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("domains.id", ondelete="CASCADE"), nullable=True
    )

    # Relationship
    domain: Mapped[Optional["Domain"]] = relationship(
        "Domain", back_populates="products"
    )
