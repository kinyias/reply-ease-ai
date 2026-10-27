from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Project Info
    PROJECT_NAME: str = "Reply-Ease-AI API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Host & Port
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security & Auth
    SECRET_KEY: str = "secret-key-for-development-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/reply_ease_ai"

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://127.0.0.1:3000"

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Google Gemini & Pinecone Vector DB (RAG)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_FALLBACK_MODELS: Union[str, List[str]] = (
        "gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-2.5-flash,gemini-3-flash,gemini-3.6-flash"
    )
    GEMINI_EMBEDDING_MODEL: str = "models/embedding-001"
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "reply-ease-ai"
    PINECONE_ENVIRONMENT: str = "us-east-1"

    @field_validator("GEMINI_FALLBACK_MODELS", mode="after")
    @classmethod
    def assemble_gemini_fallback_models(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [model.strip() for model in v.split(",") if model.strip()]
        return v

    @property
    def gemini_models_with_fallback(self) -> List[str]:
        """
        Returns the list of Gemini models to try in order:
        primary GEMINI_MODEL first, followed by GEMINI_FALLBACK_MODELS without duplicates.
        """
        models: List[str] = []
        if self.GEMINI_MODEL and self.GEMINI_MODEL.strip():
            models.append(self.GEMINI_MODEL.strip())
        fallbacks = (
            self.GEMINI_FALLBACK_MODELS
            if isinstance(self.GEMINI_FALLBACK_MODELS, list)
            else [m.strip() for m in self.GEMINI_FALLBACK_MODELS.split(",") if m.strip()]
        )
        for m in fallbacks:
            if m not in models:
                models.append(m)
        return models

    # OpenAI (Optional Fallback)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"

    # SePay Payment Configuration
    SEPAY_MERCHANT_ID: str = "YOUR_MERCHANT_ID"
    SEPAY_SECRET_KEY: str = "YOUR_MERCHANT_SECRET_KEY"
    SEPAY_WEBHOOK_API_KEY: str = ""
    SEPAY_API_URL: str = "https://my.sepay.vn/userapi"

    # SMTP Mail
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "Reply Ease AI Support"

    # App URLs & Static Files
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    STATIC_DIR: str = "static"

    # Cloudinary & File Upload Service
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_URL: str = ""
    MAX_UPLOAD_SIZE_MB: int = 2
    ALLOWED_IMAGE_TYPES: Union[str, List[str]] = (
        "image/jpeg,image/png,image/jpg,image/webp,image/gif"
    )

    @field_validator("ALLOWED_IMAGE_TYPES", mode="after")
    @classmethod
    def assemble_allowed_image_types(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [t.strip().lower() for t in v.split(",") if t.strip()]
        return [t.lower() for t in v]


settings = Settings()
