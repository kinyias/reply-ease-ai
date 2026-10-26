import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
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
