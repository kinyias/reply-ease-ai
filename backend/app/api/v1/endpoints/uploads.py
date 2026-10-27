from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.upload import ImageUploadResponse
from app.services.upload_service import upload_service

router = APIRouter()


@router.post(
    "/image",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload image to Cloudinary",
    description=(
        "Uploads an image file (PNG, JPG, JPEG, WEBP, GIF) up to 2MB directly to Cloudinary. "
        "Returns the public URL, resource ID, and file metadata."
    ),
)
async def upload_image(
    file: UploadFile = File(..., description="The image file to upload (max 2MB)"),
    current_user: User = Depends(get_current_user),
) -> ImageUploadResponse:
    """
    Endpoint for uploading images such as domain icons, bot avatars, and product photos.
    """
    return await upload_service.upload_image(file=file)
