import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatbotFAQItem(BaseModel):
    id: uuid.UUID
    question: str
    answer: str


class ChatbotProductItem(BaseModel):
    id: uuid.UUID
    name: str
    price: int
    image: Optional[str] = None


class ChatbotConfigResponse(BaseModel):
    domain_id: uuid.UUID
    domain_name: str
    welcome_message: str = "Hey there, have a question? Text us here"
    icon: Optional[str] = None
    background: Optional[str] = None
    text_color: Optional[str] = None
    helpdesk_enabled: bool = False
    faqs: List[ChatbotFAQItem] = Field(default_factory=list)
    products: List[ChatbotProductItem] = Field(default_factory=list)


class ChatbotMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Customer chat message")
    chat_history: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list,
        description="Recent chat turns [{role: 'user'|'assistant', message/content: '...'}]",
    )
    customer_email: Optional[str] = Field(None, description="Optional customer email if already captured")
    chatroom_id: Optional[uuid.UUID] = Field(None, description="Optional existing session chatroom ID")


class ChatbotMessageResponse(BaseModel):
    id: Optional[str] = None
    role: str = "assistant"
    message: str
    raw_message: Optional[str] = None
    live: bool = False
    customer_id: Optional[str] = None
    chatroom_id: Optional[str] = None
    link: Optional[str] = None
    has_complete: bool = False
    has_realtime: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatMessageHistoryItem(BaseModel):
    id: uuid.UUID
    role: str
    message: str
    seen: bool = True
    created_at: datetime


class ChatSessionHistoryResponse(BaseModel):
    chatroom_id: uuid.UUID
    live: bool = False
    messages: List[ChatMessageHistoryItem] = Field(default_factory=list)
