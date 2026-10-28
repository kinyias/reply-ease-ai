import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class HelpDeskCreateRequest(BaseModel):
    """Payload to create a new FAQ item for a domain."""

    question: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        description="FAQ question asked by customer",
        examples=["Chính sách đổi trả hàng như thế nào?"],
    )
    answer: str = Field(
        ...,
        min_length=2,
        max_length=5000,
        description="Official answer provided by website owner",
        examples=["Hỗ trợ đổi trả miễn phí trong vòng 7 ngày."],
    )


class HelpDeskUpdateRequest(BaseModel):
    """Payload to update an existing FAQ item."""

    question: Optional[str] = Field(None, min_length=3, max_length=1000)
    answer: Optional[str] = Field(None, min_length=2, max_length=5000)


class HelpDeskResponse(BaseModel):
    """FAQ item details response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    question: str
    answer: str
    domain_id: Optional[uuid.UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class FilterQuestionCreateRequest(BaseModel):
    """Payload to create a lead qualification question."""

    question: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        description="Qualifier question to be asked sequentially by the AI bot",
        examples=["Bạn đang tìm kiếm sản phẩm cho cá nhân hay doanh nghiệp?"],
    )


class FilterQuestionUpdateRequest(BaseModel):
    """Payload to update a lead qualification question."""

    question: Optional[str] = Field(None, min_length=3, max_length=1000)
    answered: Optional[str] = None


class FilterQuestionResponse(BaseModel):
    """Filter question details response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    question: str
    answered: Optional[str] = None
    domain_id: Optional[uuid.UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class KnowledgeChunkResponse(BaseModel):
    """Extracted text chunk details response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    domain_id: uuid.UUID
    chunk_index: int
    title: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None


class KnowledgeDocumentResponse(BaseModel):
    """Uploaded knowledge document details response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    domain_id: uuid.UUID
    file_name: str
    file_type: str
    file_size: int
    status: str
    num_chunks: int
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
