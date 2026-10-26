import re
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.enums import Plans


class DomainCreateRequest(BaseModel):
    """Payload for creating a new domain."""

    name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Domain hostname or website name, e.g., mystore.com or myshop",
        examples=["mystore.com"],
    )
    icon: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Icon or logo URL for the domain",
        examples=["https://example.com/logo.png"],
    )

    @field_validator("name")
    @classmethod
    def clean_domain_name(cls, v: str) -> str:
        # Strip spaces and normalize
        cleaned = v.strip().lower()
        # Remove http:// or https:// if accidentally supplied
        cleaned = re.sub(r"^https?://", "", cleaned)
        # Remove trailing slash and path if supplied
        cleaned = cleaned.split("/")[0]
        if not cleaned:
            raise ValueError("Domain name cannot be empty")
        return cleaned


class DomainUpdateRequest(BaseModel):
    """Payload for updating an existing domain."""

    name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=255,
        description="Updated domain hostname",
    )
    icon: Optional[str] = Field(
        None,
        min_length=1,
        max_length=500,
        description="Updated domain icon URL",
    )

    @field_validator("name")
    @classmethod
    def clean_update_domain_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip().lower()
        cleaned = re.sub(r"^https?://", "", cleaned)
        cleaned = cleaned.split("/")[0]
        if not cleaned:
            raise ValueError("Domain name cannot be empty")
        return cleaned


class ChatBotResponse(BaseModel):
    """ChatBot settings details response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    welcome_message: Optional[str] = "Hey there, have a question? Text us here"
    icon: Optional[str] = None
    background: Optional[str] = None
    text_color: Optional[str] = None
    helpdesk: bool = False
    domain_id: Optional[uuid.UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ChatBotUpdateRequest(BaseModel):
    """Payload for updating chatbot settings for a domain."""

    welcome_message: Optional[str] = Field(
        None,
        max_length=1000,
        description="Default welcome greeting displayed when widget opens",
    )
    icon: Optional[str] = Field(
        None,
        max_length=500,
        description="Chatbot avatar icon URL",
    )
    background: Optional[str] = Field(
        None,
        max_length=50,
        description="Widget header/accent background color (hex or class)",
    )
    text_color: Optional[str] = Field(
        None,
        max_length=50,
        description="Widget header text color",
    )
    helpdesk: Optional[bool] = Field(
        None,
        description="Whether helpdesk FAQ accordion is enabled inside widget",
    )


class ProductBriefResponse(BaseModel):
    """Brief representation of a product belonging to a domain."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    price: int
    image: str
    created_at: Optional[datetime] = None


class HelpDeskBriefResponse(BaseModel):
    """Brief FAQ item belonging to a domain."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    question: str
    answer: str
    created_at: Optional[datetime] = None


class FilterQuestionBriefResponse(BaseModel):
    """Brief lead qualifier filter question belonging to a domain."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    question: str
    answered: Optional[str] = None
    created_at: Optional[datetime] = None


class DomainResponse(BaseModel):
    """Complete representation of a Domain including chatbot and sub-resources."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    icon: str
    user_id: Optional[uuid.UUID] = None
    campaign_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    chat_bot: Optional[ChatBotResponse] = None
    products: List[ProductBriefResponse] = []
    helpdesk: List[HelpDeskBriefResponse] = []
    filter_questions: List[FilterQuestionBriefResponse] = []
    customer_count: int = 0


class DomainQuotaResponse(BaseModel):
    """Current user domain usage and subscription quota status."""

    model_config = ConfigDict(from_attributes=True)

    plan: Plans
    max_domains: int
    used_domains: int
    remaining_domains: int
    can_create_domain: bool
    credits: int
