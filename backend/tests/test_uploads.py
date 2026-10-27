import io
import os
import uuid
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token
from app.main import app
from app.models.user import User

# Minimal valid 1x1 transparent PNG bytes
TINY_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00"
    b"\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00"
    b"\x00\x00IEND\xaeB`\x82"
)


@pytest.mark.asyncio
async def test_upload_image_local_and_validation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Setup authenticated user
        user_id = uuid.uuid4()
        user_email = f"uploader_{uuid.uuid4().hex[:6]}@example.com"
        async with AsyncSessionLocal() as session:
            test_user = User(
                id=user_id,
                fullname="Uploader Tester",
                email=user_email,
                hashed_password="hashed_pw_test",
                type="owner",
            )
            session.add(test_user)
            await session.commit()

        token = create_access_token(subject=str(user_id))
        auth_headers = {"Authorization": f"Bearer {token}"}

        # 2. Test successful upload to Cloudinary (mocked)
        mock_res = {
            "public_id": "reply-ease-ai/test_logo_123",
            "secure_url": "https://res.cloudinary.com/demo/image/upload/v1/test_logo_123.png",
            "format": "png",
            "bytes": len(TINY_PNG_BYTES),
        }
        with patch("app.services.upload_service.upload_service.is_cloudinary_configured", return_value=True):
            with patch("cloudinary.uploader.upload", return_value=mock_res):
                files = {
                    "file": ("test_logo.png", io.BytesIO(TINY_PNG_BYTES), "image/png")
                }
                response = await ac.post("/api/v1/uploads/image", headers=auth_headers, files=files)
                assert response.status_code == 201, response.text
                data = response.json()
                assert data["provider"] == "cloudinary"
                assert data["url"] == mock_res["secure_url"]
                assert data["id"] == mock_res["public_id"]
                assert data["format"] == "png"
                assert data["bytes"] == len(TINY_PNG_BYTES)

        # 3. Test invalid MIME type rejected
        invalid_files = {
            "file": ("script.sh", io.BytesIO(b"echo 'malicious'"), "text/plain")
        }
        res_invalid = await ac.post(
            "/api/v1/uploads/image", headers=auth_headers, files=invalid_files
        )
        assert res_invalid.status_code == 400
        assert "Unsupported image type" in res_invalid.json()["detail"]

        # 4. Test oversized file rejected (>2MB)
        oversized_data = b"x" * (settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024 + 1024)
        oversized_files = {
            "file": ("huge.jpg", io.BytesIO(oversized_data), "image/jpeg")
        }
        res_oversized = await ac.post(
            "/api/v1/uploads/image", headers=auth_headers, files=oversized_files
        )
        assert res_oversized.status_code == 400
        assert "exceeds the maximum allowed limit" in res_oversized.json()["detail"]

        # 5. Test unauthenticated request rejected with 401
        res_unauth = await ac.post(
            "/api/v1/uploads/image",
            files={"file": ("test.png", io.BytesIO(TINY_PNG_BYTES), "image/png")},
        )
        assert res_unauth.status_code == 401


@pytest.mark.asyncio
async def test_upload_image_cloudinary_mocked():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Setup user
        user_id = uuid.uuid4()
        user_email = f"cloud_up_{uuid.uuid4().hex[:6]}@example.com"
        async with AsyncSessionLocal() as session:
            test_user = User(
                id=user_id,
                fullname="Cloudinary Uploader",
                email=user_email,
                hashed_password="hashed_pw_test",
                type="owner",
            )
            session.add(test_user)
            await session.commit()

        token = create_access_token(subject=str(user_id))
        auth_headers = {"Authorization": f"Bearer {token}"}

        # Mock Cloudinary configured and upload response
        mock_cloudinary_result = {
            "public_id": "reply-ease-ai/mock_logo_123",
            "secure_url": "https://res.cloudinary.com/demo/image/upload/v12345/mock_logo_123.png",
            "format": "png",
            "bytes": len(TINY_PNG_BYTES),
            "width": 100,
            "height": 100,
            "created_at": "2026-10-27T12:00:00Z",
        }

        with patch(
            "app.services.upload_service.upload_service.is_cloudinary_configured",
            return_value=True,
        ):
            with patch(
                "cloudinary.uploader.upload", return_value=mock_cloudinary_result
            ) as mock_upload:
                files = {
                    "file": ("logo.png", io.BytesIO(TINY_PNG_BYTES), "image/png")
                }
                response = await ac.post(
                    "/api/v1/uploads/image", headers=auth_headers, files=files
                )
                assert response.status_code == 201, response.text
                data = response.json()
                assert data["provider"] == "cloudinary"
                assert data["url"] == mock_cloudinary_result["secure_url"]
                assert data["id"] == mock_cloudinary_result["public_id"]
                assert data["width"] == 100
                assert data["height"] == 100
                assert mock_upload.called
