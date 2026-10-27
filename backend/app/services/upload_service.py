import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, UploadFile, status
import cloudinary
import cloudinary.uploader

from app.core.config import settings
from app.schemas.upload import ImageUploadResponse

import io

logger = logging.getLogger(__name__)

# Map MIME types to canonical file extensions
MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


class UploadService:
    def __init__(self):
        self._configure_cloudinary()

    def _configure_cloudinary(self):
        """Configure Cloudinary SDK with robust sanitization."""
        # 1. Prioritize explicit cloud name, key, and secret
        if (
            settings.CLOUDINARY_CLOUD_NAME
            and settings.CLOUDINARY_API_KEY
            and settings.CLOUDINARY_API_SECRET
        ):
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME.strip(),
                api_key=settings.CLOUDINARY_API_KEY.strip(),
                api_secret=settings.CLOUDINARY_API_SECRET.strip(),
                secure=True,
            )
            logger.info("Cloudinary configured via explicit API keys")
            return

        # 2. Parse CLOUDINARY_URL with auto-cleanup of prefixes and brackets
        if settings.CLOUDINARY_URL:
            raw_url = settings.CLOUDINARY_URL.strip()
            if raw_url.startswith("CLOUDINARY_URL="):
                raw_url = raw_url[len("CLOUDINARY_URL="):].strip()
            raw_url = raw_url.replace("<", "").replace(">", "").strip('"').strip("'")
            cloudinary.config(cloudinary_url=raw_url, secure=True)
            logger.info("Cloudinary configured via CLOUDINARY_URL")

    def is_cloudinary_configured(self) -> bool:
        """Check whether Cloudinary credentials have been provided."""
        config = cloudinary.config()
        if not (config.cloud_name and config.api_key and config.api_secret):
            self._configure_cloudinary()
            config = cloudinary.config()
        return bool(config.cloud_name and config.api_key and config.api_secret)

    async def validate_image(self, file: UploadFile) -> bytes:
        """
        Validate file content type and size limit.
        Returns file content bytes.
        """
        content_type = (file.content_type or "").lower().strip()
        allowed_types = [t.lower().strip() for t in settings.ALLOWED_IMAGE_TYPES]

        if content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Unsupported image type: '{content_type}'. "
                    f"Allowed types: {', '.join(allowed_types)}"
                ),
            )

        content = await file.read()
        if not content or len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"File size ({len(content)} bytes) exceeds the maximum allowed "
                    f"limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
                ),
            )

        return content

    async def upload_image(
        self,
        file: UploadFile,
        folder: str = "reply-ease-ai",
    ) -> ImageUploadResponse:
        """
        Upload image file directly to Cloudinary (no local static fallback).
        """
        content = await self.validate_image(file)
        content_type = (file.content_type or "").lower().strip()
        ext = MIME_TO_EXT.get(content_type, ".jpg")

        if not self.is_cloudinary_configured():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Dịch vụ Cloudinary chưa được cấu hình. "
                    "Vui lòng thiết lập CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET trong .env."
                ),
            )

        try:
            public_id = f"{uuid.uuid4().hex}"
            result = await asyncio.to_thread(
                cloudinary.uploader.upload,
                io.BytesIO(content),
                folder=folder,
                public_id=public_id,
                resource_type="image",
                overwrite=True,
            )
            logger.info(
                "Uploaded image to Cloudinary: public_id=%s, url=%s",
                result.get("public_id"),
                result.get("secure_url"),
            )
            return ImageUploadResponse(
                url=result.get("secure_url"),
                id=result.get("public_id", public_id),
                provider="cloudinary",
                filename=file.filename,
                format=result.get("format", ext.lstrip(".")),
                bytes=result.get("bytes", len(content)),
                width=result.get("width"),
                height=result.get("height"),
                created_at=result.get("created_at") or datetime.now(timezone.utc).isoformat(),
            )
        except Exception as e:
            logger.error("Cloudinary upload failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Upload ảnh lên Cloudinary thất bại: {str(e)}",
            )


upload_service = UploadService()
