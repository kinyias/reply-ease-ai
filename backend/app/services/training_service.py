import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.filter_question import FilterQuestions
from app.models.helpdesk import HelpDesk
from app.models.user import User
from app.schemas.training import (
    FilterQuestionCreateRequest,
    FilterQuestionUpdateRequest,
    HelpDeskCreateRequest,
    HelpDeskUpdateRequest,
)
from app.services.domain_service import get_domain_by_id


# ==========================================
# 1. HelpDesk FAQ Management
# ==========================================


async def get_helpdesk_faqs(
    db: AsyncSession, domain_id: uuid.UUID, user: User
) -> List[HelpDesk]:
    """Retrieve all HelpDesk FAQ questions for a domain owned by user."""
    # Ensure domain ownership
    await get_domain_by_id(db, domain_id, user)

    stmt = (
        select(HelpDesk)
        .where(HelpDesk.domain_id == domain_id)
        .order_by(HelpDesk.created_at.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_helpdesk_faq(
    db: AsyncSession,
    domain_id: uuid.UUID,
    user: User,
    faq_in: HelpDeskCreateRequest,
) -> HelpDesk:
    """Create a new HelpDesk FAQ for a domain."""
    await get_domain_by_id(db, domain_id, user)

    faq = HelpDesk(
        id=uuid.uuid4(),
        question=faq_in.question.strip(),
        answer=faq_in.answer.strip(),
        domain_id=domain_id,
    )
    db.add(faq)
    await db.commit()
    await db.refresh(faq)
    return faq


async def update_helpdesk_faq(
    db: AsyncSession,
    domain_id: uuid.UUID,
    faq_id: uuid.UUID,
    user: User,
    faq_in: HelpDeskUpdateRequest,
) -> HelpDesk:
    """Update an existing HelpDesk FAQ."""
    await get_domain_by_id(db, domain_id, user)

    stmt = select(HelpDesk).where(
        HelpDesk.id == faq_id, HelpDesk.domain_id == domain_id
    )
    result = await db.execute(stmt)
    faq = result.scalar_one_or_none()

    if not faq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"HelpDesk FAQ with ID '{faq_id}' not found.",
        )

    if faq_in.question is not None:
        faq.question = faq_in.question.strip()
    if faq_in.answer is not None:
        faq.answer = faq_in.answer.strip()

    await db.commit()
    await db.refresh(faq)
    return faq


async def delete_helpdesk_faq(
    db: AsyncSession, domain_id: uuid.UUID, faq_id: uuid.UUID, user: User
) -> bool:
    """Delete a HelpDesk FAQ item."""
    await get_domain_by_id(db, domain_id, user)

    stmt = select(HelpDesk).where(
        HelpDesk.id == faq_id, HelpDesk.domain_id == domain_id
    )
    result = await db.execute(stmt)
    faq = result.scalar_one_or_none()

    if not faq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"HelpDesk FAQ with ID '{faq_id}' not found.",
        )

    await db.delete(faq)
    await db.commit()
    return True


# ==========================================
# 2. Filter Questions (Lead Qualifier)
# ==========================================


async def get_filter_questions(
    db: AsyncSession, domain_id: uuid.UUID, user: User
) -> List[FilterQuestions]:
    """Retrieve all lead qualifier questions for a domain owned by user."""
    await get_domain_by_id(db, domain_id, user)

    stmt = (
        select(FilterQuestions)
        .where(FilterQuestions.domain_id == domain_id)
        .order_by(FilterQuestions.created_at.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_filter_question(
    db: AsyncSession,
    domain_id: uuid.UUID,
    user: User,
    q_in: FilterQuestionCreateRequest,
) -> FilterQuestions:
    """Create a new lead qualifier question for a domain."""
    await get_domain_by_id(db, domain_id, user)

    question = FilterQuestions(
        id=uuid.uuid4(),
        question=q_in.question.strip(),
        answered=None,
        domain_id=domain_id,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


async def update_filter_question(
    db: AsyncSession,
    domain_id: uuid.UUID,
    question_id: uuid.UUID,
    user: User,
    q_in: FilterQuestionUpdateRequest,
) -> FilterQuestions:
    """Update a lead qualifier question."""
    await get_domain_by_id(db, domain_id, user)

    stmt = select(FilterQuestions).where(
        FilterQuestions.id == question_id,
        FilterQuestions.domain_id == domain_id,
    )
    result = await db.execute(stmt)
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Filter question with ID '{question_id}' not found.",
        )

    if q_in.question is not None:
        question.question = q_in.question.strip()
    if q_in.answered is not None:
        question.answered = q_in.answered

    await db.commit()
    await db.refresh(question)
    return question


async def delete_filter_question(
    db: AsyncSession,
    domain_id: uuid.UUID,
    question_id: uuid.UUID,
    user: User,
) -> bool:
    """Delete a lead qualifier question."""
    await get_domain_by_id(db, domain_id, user)

    stmt = select(FilterQuestions).where(
        FilterQuestions.id == question_id,
        FilterQuestions.domain_id == domain_id,
    )
    result = await db.execute(stmt)
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Filter question with ID '{question_id}' not found.",
        )

    await db.delete(question)
    await db.commit()
    return True
