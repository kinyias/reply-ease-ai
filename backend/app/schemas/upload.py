from typing import Optional
from pydantic import BaseModel, Field


class ImageUploadResponse(BaseModel):
    url: str = Field(..., description="Publicly accessible URL of the uploaded image")
    id: str = Field(..., description="Unique identifier (Cloudinary public_id or local filename)")
    provider: str = Field(..., description="Storage provider: 'cloudinary' or 'local'")
    filename: Optional[str] = Field(None, description="Original or generated file name")
    format: Optional[str] = Field(None, description="Image format: jpg, png, webp, etc.")
    bytes: Optional[int] = Field(None, description="Image size in bytes")
    width: Optional[int] = Field(None, description="Image width in pixels if known")
    height: Optional[int] = Field(None, description="Image height in pixels if known")
    created_at: Optional[str] = Field(None, description="Timestamp of upload")
