import uuid
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.billing import Billings
from app.models.chatbot import ChatBot
from app.models.customer import Customer
from app.models.domain import Domain
from app.models.enums import Plans
from app.models.user import User
from app.schemas.domain import (
    ChatBotUpdateRequest,
    DomainCreateRequest,
    DomainQuotaResponse,
    DomainUpdateRequest,
)

# Quota limit specifications by subscription plan
PLAN_DOMAIN_LIMITS: dict[Plans, int] = {
    Plans.STANDARD: 1,
    Plans.PRO: 5,
    Plans.ULTIMATE: 10,
}


async def get_user_billing_plan(db: AsyncSession, user: User) -> Tuple[Plans, int]:
    """Retrieve the user's active billing plan and credits.
    Falls back to STANDARD (10 credits) if not yet provisioned.
    """
    if user.subscription:
        return user.subscription.plan, user.subscription.credits

    stmt = select(Billings).where(Billings.user_id == user.id)
    result = await db.execute(stmt)
    billing = result.scalar_one_or_none()

    if billing:
        return billing.plan, billing.credits

    return Plans.STANDARD, 10


async def count_user_domains(db: AsyncSession, user_id: uuid.UUID) -> int:
    """Count the total number of domains currently owned by a user."""
    stmt = select(func.count(Domain.id)).where(Domain.user_id == user_id)
    result = await db.execute(stmt)
    count = result.scalar() or 0
    return int(count)


async def check_domain_quota(
    db: AsyncSession, user: User
) -> Tuple[bool, int, int, Plans, int]:
    """Check if the user has reached their domain quota limit.

    Returns:
        (can_create, current_count, max_limit, plan, credits)
    """
    plan, credits = await get_user_billing_plan(db, user)
    max_limit = PLAN_DOMAIN_LIMITS.get(plan, 1)
    current_count = await count_user_domains(db, user.id)
    can_create = current_count < max_limit
    return can_create, current_count, max_limit, plan, credits


async def get_domain_quota_status(
    db: AsyncSession, user: User
) -> DomainQuotaResponse:
    """Get the current domain quota summary for the user."""
    can_create, used_count, max_limit, plan, credits = await check_domain_quota(
        db, user
    )
    remaining = max(0, max_limit - used_count)
    return DomainQuotaResponse(
        plan=plan,
        max_domains=max_limit,
        used_domains=used_count,
        remaining_domains=remaining,
        can_create_domain=can_create,
        credits=credits,
    )


async def create_domain(
    db: AsyncSession, user: User, domain_in: DomainCreateRequest
) -> Domain:
    """Create a new domain for the user with quota verification, duplicate validation,
    and automatic default ChatBot generation.
    """
    # 1. Quota Validation
    can_create, current_count, max_limit, plan, _ = await check_domain_quota(
        db, user
    )
    if not can_create:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You've reached the maximum number of domains, upgrade your plan",
        )

    # 2. Check for duplicate domain name under the same user account
    stmt_check = select(Domain).where(
        Domain.user_id == user.id,
        func.lower(Domain.name) == domain_in.name.lower(),
    )
    res_check = await db.execute(stmt_check)
    existing_domain = res_check.scalar_one_or_none()
    if existing_domain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Domain with name '{domain_in.name}' already exists in your account.",
        )

    # 3. Create Domain entity
    domain_id = uuid.uuid4()
    domain = Domain(
        id=domain_id,
        name=domain_in.name,
        icon=domain_in.icon,
        user_id=user.id,
    )
    db.add(domain)

    # 4. Automatically generate linked default ChatBot entity
    chatbot = ChatBot(
        id=uuid.uuid4(),
        welcome_message="Hey there, have a question? Text us here",
        icon=domain_in.icon,
        background=None,
        text_color=None,
        helpdesk=False,
        domain_id=domain_id,
    )
    db.add(chatbot)

    # 5. Commit and refresh
    await db.commit()

    # Re-fetch with all eager relationships loaded
    return await get_domain_by_id(db, domain_id, user)


async def get_user_domains(db: AsyncSession, user: User) -> List[Domain]:
    """Retrieve all domains owned by the user, with chatbot, products, helpdesk,
    and filter questions loaded.
    """
    stmt = (
        select(Domain)
        .where(Domain.user_id == user.id)
        .order_by(Domain.created_at.desc())
        .options(
            selectinload(Domain.chat_bot),
            selectinload(Domain.products),
            selectinload(Domain.helpdesk),
            selectinload(Domain.filter_questions),
            selectinload(Domain.customers),
        )
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_domain_by_id(
    db: AsyncSession, domain_id: uuid.UUID, user: User
) -> Domain:
    """Retrieve a single domain by ID, ensuring user ownership."""
    stmt = (
        select(Domain)
        .where(Domain.id == domain_id, Domain.user_id == user.id)
        .options(
            selectinload(Domain.chat_bot),
            selectinload(Domain.products),
            selectinload(Domain.helpdesk),
            selectinload(Domain.filter_questions),
            selectinload(Domain.customers),
        )
    )
    result = await db.execute(stmt)
    domain = result.scalar_one_or_none()

    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain with ID '{domain_id}' not found.",
        )

    return domain


async def update_domain(
    db: AsyncSession,
    domain_id: uuid.UUID,
    user: User,
    domain_in: DomainUpdateRequest,
) -> Domain:
    """Update domain name or icon, verifying ownership and uniqueness."""
    domain = await get_domain_by_id(db, domain_id, user)

    if domain_in.name is not None and domain_in.name != domain.name:
        # Check uniqueness among user's other domains
        stmt_dup = select(Domain).where(
            Domain.user_id == user.id,
            Domain.id != domain_id,
            func.lower(Domain.name) == domain_in.name.lower(),
        )
        res_dup = await db.execute(stmt_dup)
        if res_dup.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Domain with name '{domain_in.name}' already exists in your account.",
            )
        domain.name = domain_in.name

    if domain_in.icon is not None:
        domain.icon = domain_in.icon

    await db.commit()
    await db.refresh(domain)
    return domain


async def delete_domain(
    db: AsyncSession, domain_id: uuid.UUID, user: User
) -> bool:
    """Delete a domain and cascade-delete its chatbot, helpdesk, filter questions,
    products, and customers.
    """
    domain = await get_domain_by_id(db, domain_id, user)
    await db.delete(domain)
    await db.commit()
    return True


async def update_chatbot_settings(
    db: AsyncSession,
    domain_id: uuid.UUID,
    user: User,
    chatbot_in: ChatBotUpdateRequest,
) -> ChatBot:
    """Update chatbot customization for a domain (welcome message, avatar, colors, helpdesk)."""
    domain = await get_domain_by_id(db, domain_id, user)

    stmt = select(ChatBot).where(ChatBot.domain_id == domain_id)
    result = await db.execute(stmt)
    chatbot = result.scalar_one_or_none()

    if not chatbot:
        # If chatbot doesn't exist for any reason, create it
        chatbot = ChatBot(
            id=uuid.uuid4(),
            domain_id=domain_id,
            welcome_message="Hey there, have a question? Text us here",
            icon=domain.icon,
        )
        db.add(chatbot)

    if chatbot_in.welcome_message is not None:
        chatbot.welcome_message = chatbot_in.welcome_message
    if chatbot_in.icon is not None:
        chatbot.icon = chatbot_in.icon
    if chatbot_in.background is not None:
        chatbot.background = chatbot_in.background
    if chatbot_in.text_color is not None:
        chatbot.text_color = chatbot_in.text_color
    if chatbot_in.helpdesk is not None:
        chatbot.helpdesk = chatbot_in.helpdesk

    await db.commit()
    await db.refresh(chatbot)
    return chatbot


async def get_chatbot_by_domain_id(
    db: AsyncSession,
    domain_id: uuid.UUID,
    user: User,
) -> ChatBot:
    """Retrieve chatbot settings for a specific domain owned by user."""
    domain = await get_domain_by_id(db, domain_id, user)
    stmt = select(ChatBot).where(ChatBot.domain_id == domain.id)
    result = await db.execute(stmt)
    chatbot = result.scalar_one_or_none()

    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chatbot for domain '{domain_id}' not found.",
        )
    return chatbot

