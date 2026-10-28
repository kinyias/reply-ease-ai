import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerQuestionAnswerBrief(BaseModel):
    """Brief representation of a customer's answer to a filter question."""
    id: uuid.UUID
    question: str
    answered: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CustomerLeadItem(BaseModel):
    """Lead summary for marketing segmentation & inspection."""
    id: uuid.UUID
    email: Optional[str] = None
    domain_id: Optional[uuid.UUID] = None
    domain_name: Optional[str] = None
    created_at: datetime
    responses: List[CustomerQuestionAnswerBrief] = []
    answered_count: int = 0
    total_questions: int = 0

    model_config = ConfigDict(from_attributes=True)


class CustomerLeadListResponse(BaseModel):
    """List of customer leads for marketing selection."""
    customers: List[CustomerLeadItem]
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1


class CampaignCreateRequest(BaseModel):
    """Request payload to create a new marketing campaign."""
    name: str = Field(..., min_length=1, max_length=255, description="Tên chiến dịch email")
    template: Optional[str] = Field(None, description="Mẫu nội dung email (Text hoặc HTML)")
    customers: Optional[List[str]] = Field(default_factory=list, description="Danh sách email khách hàng ban đầu")


class CampaignUpdateRequest(BaseModel):
    """Request payload to update campaign metadata."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    template: Optional[str] = None
    customers: Optional[List[str]] = None


class CampaignTemplateUpdateRequest(BaseModel):
    """Payload to update only the email template of a campaign."""
    template: str = Field(..., description="Nội dung template email mới")


class CampaignCustomersUpdateRequest(BaseModel):
    """Payload to assign a list of recipient emails to a campaign."""
    customers: List[str] = Field(..., description="Danh sách các địa chỉ email nhận tin")


class CampaignSendRequest(BaseModel):
    """Optional payload to specify or override recipient emails when sending."""
    emails: Optional[List[str]] = Field(None, description="Danh sách email gửi trực tiếp, nếu để trống sẽ lấy từ campaign.customers")


class CampaignResponse(BaseModel):
    """Campaign response model."""
    id: uuid.UUID
    name: str
    customers: List[str] = []
    template: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    recipients_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class CampaignListResponse(BaseModel):
    """List of campaigns owned by the current user."""
    campaigns: List[CampaignResponse]
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1



class CampaignSendResponse(BaseModel):
    """Response returned when a bulk marketing mailing task is queued."""
    message: str
    campaign_id: uuid.UUID
    total_recipients: int
    credits_deducted: int
    remaining_credits: int
