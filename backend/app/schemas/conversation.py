import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import Role


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    message: str
    role: Role
    seen: bool
    chat_room_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None


class CustomerBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: Optional[str] = None
    created_at: datetime
    answered_questions_count: int = 0
    total_questions_count: int = 0


class ChatRoomSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    domain_id: uuid.UUID
    domain_name: str
    live: bool
    mailed: bool
    customer: Optional[CustomerBrief] = None
    last_message: Optional[ChatMessageResponse] = None
    unread_count: int = 0
    is_urgent: bool = False
    created_at: datetime
    updated_at: datetime


class ConversationListResponse(BaseModel):
    rooms: List[ChatRoomSummary]
    total: int
    unread_total: int
    live_total: int
    urgent_total: int
    page: int = 1
    page_size: int = 15
    total_pages: int = 1



class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000, description="Nội dung tin nhắn gửi khách hàng")


class ToggleRealtimeRequest(BaseModel):
    live: bool = Field(..., description="Bật (True) hoặc Tắt (False) chế độ can thiệp người thật")


class ToggleRealtimeResponse(BaseModel):
    room_id: uuid.UUID
    live: bool
    message: str


class MarkSeenResponse(BaseModel):
    room_id: uuid.UUID
    seen_count: int
    message: str
