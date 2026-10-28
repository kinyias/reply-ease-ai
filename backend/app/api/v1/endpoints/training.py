import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.training import (
    FilterQuestionCreateRequest,
    FilterQuestionResponse,
    FilterQuestionUpdateRequest,
    HelpDeskCreateRequest,
    HelpDeskResponse,
    HelpDeskUpdateRequest,
    KnowledgeChunkResponse,
    KnowledgeDocumentResponse,
)
from app.services import training_service

router = APIRouter()


# ==========================================
# 1. HelpDesk FAQ Endpoints
# ==========================================


@router.get(
    "/{domain_id}/helpdesk",
    response_model=List[HelpDeskResponse],
    summary="Get domain HelpDesk FAQs",
    description="Retrieve all FAQ items configured for a specific domain owned by the authenticated user.",
)
async def list_helpdesk_faqs(
    domain_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[HelpDeskResponse]:
    """Retrieve all HelpDesk FAQ questions for a domain."""
    faqs = await training_service.get_helpdesk_faqs(
        db, domain_id, current_user
    )
    return [HelpDeskResponse.model_validate(f) for f in faqs]


@router.post(
    "/{domain_id}/helpdesk",
    response_model=HelpDeskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create HelpDesk FAQ",
    description="Add a new FAQ question and answer pair for a domain.",
)
async def create_helpdesk_faq(
    domain_id: uuid.UUID,
    faq_in: HelpDeskCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HelpDeskResponse:
    """Create a new HelpDesk FAQ item."""
    faq = await training_service.create_helpdesk_faq(
        db, domain_id, current_user, faq_in
    )
    return HelpDeskResponse.model_validate(faq)


@router.put(
    "/{domain_id}/helpdesk/{faq_id}",
    response_model=HelpDeskResponse,
    summary="Update HelpDesk FAQ",
    description="Update question or answer of an existing FAQ item.",
)
async def update_helpdesk_faq(
    domain_id: uuid.UUID,
    faq_id: uuid.UUID,
    faq_in: HelpDeskUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HelpDeskResponse:
    """Update an existing HelpDesk FAQ item."""
    faq = await training_service.update_helpdesk_faq(
        db, domain_id, faq_id, current_user, faq_in
    )
    return HelpDeskResponse.model_validate(faq)


@router.delete(
    "/{domain_id}/helpdesk/{faq_id}",
    response_model=Dict[str, Any],
    summary="Delete HelpDesk FAQ",
    description="Delete an existing FAQ question from a domain.",
)
async def delete_helpdesk_faq(
    domain_id: uuid.UUID,
    faq_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a HelpDesk FAQ item."""
    await training_service.delete_helpdesk_faq(
        db, domain_id, faq_id, current_user
    )
    return {
        "message": "HelpDesk FAQ deleted successfully",
        "faq_id": str(faq_id),
    }


# ==========================================
# 2. Filter Questions (Lead Qualifier) Endpoints
# ==========================================


@router.get(
    "/{domain_id}/filter-questions",
    response_model=List[FilterQuestionResponse],
    summary="Get domain filter questions",
    description="Retrieve all lead qualification questions for a domain.",
)
async def list_filter_questions(
    domain_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[FilterQuestionResponse]:
    """Retrieve all filter questions for a domain."""
    questions = await training_service.get_filter_questions(
        db, domain_id, current_user
    )
    return [FilterQuestionResponse.model_validate(q) for q in questions]


@router.post(
    "/{domain_id}/filter-questions",
    response_model=FilterQuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create filter question",
    description="Add a new lead qualification question to be asked sequentially by the AI bot.",
)
async def create_filter_question(
    domain_id: uuid.UUID,
    q_in: FilterQuestionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FilterQuestionResponse:
    """Create a new filter question."""
    question = await training_service.create_filter_question(
        db, domain_id, current_user, q_in
    )
    return FilterQuestionResponse.model_validate(question)


@router.put(
    "/{domain_id}/filter-questions/{question_id}",
    response_model=FilterQuestionResponse,
    summary="Update filter question",
    description="Update a lead qualification question.",
)
async def update_filter_question(
    domain_id: uuid.UUID,
    question_id: uuid.UUID,
    q_in: FilterQuestionUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FilterQuestionResponse:
    """Update an existing filter question."""
    question = await training_service.update_filter_question(
        db, domain_id, question_id, current_user, q_in
    )
    return FilterQuestionResponse.model_validate(question)


@router.delete(
    "/{domain_id}/filter-questions/{question_id}",
    response_model=Dict[str, Any],
    summary="Delete filter question",
    description="Delete a lead qualification question from a domain.",
)
async def delete_filter_question(
    domain_id: uuid.UUID,
    question_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a filter question."""
    await training_service.delete_filter_question(
        db, domain_id, question_id, current_user
    )
    return {
        "message": "Filter question deleted successfully",
        "question_id": str(question_id),
    }


# ==========================================
# 3. Knowledge Document Training Endpoints (PDF, Excel, TXT)
# ==========================================


@router.get(
    "/{domain_id}/documents",
    response_model=List[KnowledgeDocumentResponse],
    summary="Get trained knowledge documents",
    description="Retrieve all uploaded training documents (PDF, Excel, TXT) for a domain.",
)
async def list_knowledge_documents(
    domain_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[KnowledgeDocumentResponse]:
    """Retrieve all uploaded documents trained for this domain."""
    docs = await training_service.get_knowledge_documents(
        db, domain_id, current_user
    )
    return [KnowledgeDocumentResponse.model_validate(d) for d in docs]


@router.post(
    "/{domain_id}/documents",
    response_model=KnowledgeDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and train document (PDF, Excel, TXT)",
    description="Upload a PDF, Excel (.xlsx/.xls/.csv), or TXT/Markdown file to automatically parse, chunk, and train the AI knowledge base.",
)
async def upload_knowledge_document(
    domain_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> KnowledgeDocumentResponse:
    """Upload and train a new knowledge document for a domain."""
    doc = await training_service.upload_and_train_document(
        db, domain_id, current_user, file
    )
    return KnowledgeDocumentResponse.model_validate(doc)


@router.get(
    "/{domain_id}/documents/{document_id}/chunks",
    response_model=List[KnowledgeChunkResponse],
    summary="Get document extracted text chunks",
    description="Retrieve all text chunks extracted from a specific document for inspection or verification.",
)
async def list_document_chunks(
    domain_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[KnowledgeChunkResponse]:
    """Retrieve extracted chunks for an uploaded document."""
    chunks = await training_service.get_document_chunks(
        db, domain_id, document_id, current_user
    )
    return [KnowledgeChunkResponse.model_validate(c) for c in chunks]


@router.delete(
    "/{domain_id}/documents/{document_id}",
    response_model=Dict[str, Any],
    summary="Delete knowledge document",
    description="Delete an uploaded document, its extracted chunks, and vector embeddings from the AI knowledge base.",
)
async def delete_knowledge_document(
    domain_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a knowledge document and its vectors."""
    await training_service.delete_knowledge_document(
        db, domain_id, document_id, current_user
    )
    return {
        "message": "Knowledge document deleted successfully",
        "document_id": str(document_id),
    }


@router.post(
    "/{domain_id}/documents/{document_id}/retrain",
    response_model=KnowledgeDocumentResponse,
    summary="Retrain knowledge document",
    description="Re-vectorize and re-sync document chunks to Pinecone vector DB.",
)
async def retrain_knowledge_document(
    domain_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> KnowledgeDocumentResponse:
    """Retrain and re-embed all chunks of an existing document."""
    doc = await training_service.retrain_knowledge_document(
        db, domain_id, document_id, current_user
    )
    return KnowledgeDocumentResponse.model_validate(doc)
