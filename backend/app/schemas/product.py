import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ProductCreateRequest(BaseModel):
    """Payload for creating a new product under a domain."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Name of the product or service",
        examples=["Gói Tư Vấn Doanh Nghiệp"],
    )
    price: int = Field(
        ...,
        ge=0,
        description="Price in VND (must be non-negative)",
        examples=[500000],
    )
    image: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Public URL for product image / thumbnail",
        examples=["https://images.unsplash.com/photo-1556742049-0a67e557224f"],
    )


class ProductUpdateRequest(BaseModel):
    """Payload for updating an existing product."""

    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Updated product name",
    )
    price: Optional[int] = Field(
        None,
        ge=0,
        description="Updated price in VND",
    )
    image: Optional[str] = Field(
        None,
        min_length=1,
        max_length=500,
        description="Updated product image URL",
    )


class ProductResponse(BaseModel):
    """Complete product response item."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    price: int
    image: str
    domain_id: Optional[uuid.UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
