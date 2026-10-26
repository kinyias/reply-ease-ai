import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.domain import (
    ChatBotResponse,
    ChatBotUpdateRequest,
    DomainCreateRequest,
    DomainQuotaResponse,
    DomainResponse,
    DomainUpdateRequest,
)
from app.services import domain_service

router = APIRouter()


@router.get(
    "/quota",
    response_model=DomainQuotaResponse,
    summary="Get user domain quota status",
    description="Returns current billing plan, max domains limit, used domains count, remaining quota, and credit balance.",
)
async def get_domain_quota(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DomainQuotaResponse:
    """Retrieve the domain quota status for the authenticated user."""
    return await domain_service.get_domain_quota_status(db, current_user)


@router.get(
    "",
    response_model=List[DomainResponse],
    summary="List all user domains",
    description="Retrieve all domains owned by the authenticated user, including linked chatbot settings, products, and FAQ.",
)
async def list_domains(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[DomainResponse]:
    """Retrieve all domains owned by the current authenticated user."""
    domains = await domain_service.get_user_domains(db, current_user)
    return [DomainResponse.model_validate(d) for d in domains]


@router.post(
    "",
    response_model=DomainResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new domain",
    description="Create a domain with quota validation according to user's plan and auto-generate default ChatBot widget settings.",
)
async def create_domain(
    domain_in: DomainCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DomainResponse:
    """Create a new domain for the authenticated user."""
    domain = await domain_service.create_domain(db, current_user, domain_in)
    return DomainResponse.model_validate(domain)


@router.get(
    "/{domain_id}",
    response_model=DomainResponse,
    summary="Get domain details",
    description="Retrieve full details for a specific domain owned by the authenticated user.",
)
async def get_domain(
    domain_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DomainResponse:
    """Retrieve details of a domain by its ID."""
    domain = await domain_service.get_domain_by_id(db, domain_id, current_user)
    return DomainResponse.model_validate(domain)


@router.put(
    "/{domain_id}",
    response_model=DomainResponse,
    summary="Update domain",
    description="Update domain name or icon, verifying ownership and preventing duplicate names.",
)
async def update_domain(
    domain_id: uuid.UUID,
    domain_in: DomainUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DomainResponse:
    """Update domain name or icon."""
    domain = await domain_service.update_domain(
        db, domain_id, current_user, domain_in
    )
    return DomainResponse.model_validate(domain)


@router.delete(
    "/{domain_id}",
    response_model=Dict[str, Any],
    summary="Delete domain",
    description="Delete domain and cascade-delete its chatbot, helpdesk, filter questions, products, and customers.",
)
async def delete_domain(
    domain_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a domain and its cascade dependencies."""
    await domain_service.delete_domain(db, domain_id, current_user)
    return {
        "message": "Domain and all associated data deleted successfully",
        "domain_id": str(domain_id),
    }


@router.get(
    "/{domain_id}/chatbot",
    response_model=ChatBotResponse,
    summary="Get chatbot settings",
    description="Retrieve chatbot customization settings for a domain owned by the user.",
)
async def get_chatbot_settings(
    domain_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatBotResponse:
    """Get chatbot configuration for the domain."""
    chatbot = await domain_service.get_chatbot_by_domain_id(
        db, domain_id, current_user
    )
    return ChatBotResponse.model_validate(chatbot)


@router.put(
    "/{domain_id}/chatbot",
    response_model=ChatBotResponse,
    summary="Update chatbot settings",
    description="Update chatbot customization (welcome message, avatar, theme background, text color, helpdesk toggle).",
)
async def update_chatbot_settings(
    domain_id: uuid.UUID,
    chatbot_in: ChatBotUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatBotResponse:
    """Update chatbot configuration for the domain."""
    chatbot = await domain_service.update_chatbot_settings(
        db, domain_id, current_user, chatbot_in
    )
    return ChatBotResponse.model_validate(chatbot)
