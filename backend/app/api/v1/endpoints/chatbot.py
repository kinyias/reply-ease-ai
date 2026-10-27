import re
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.chat_message import ChatMessage
from app.models.chatroom import ChatRoom
from app.models.domain import Domain
from app.models.helpdesk import HelpDesk
from app.models.product import Product
from app.schemas.chatbot import (
    ChatSessionHistoryResponse,
    ChatMessageHistoryItem,
    ChatbotConfigResponse,
    ChatbotFAQItem,
    ChatbotMessageRequest,
    ChatbotMessageResponse,
    ChatbotProductItem,
)
from app.services.ai_bot_service import process_ai_chat

router = APIRouter()


@router.get(
    "/{domain_id}/config",
    response_model=ChatbotConfigResponse,
    summary="Get Public Chatbot Configuration",
    description="Public API to retrieve chatbot branding, welcome message, HelpDesk FAQs, and product catalog for the embed widget.",
)
async def get_chatbot_config(
    domain_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Domain)
        .options(selectinload(Domain.chat_bot))
        .where(Domain.id == domain_id)
    )
    result = await db.execute(stmt)
    domain = result.scalar_one_or_none()

    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain with ID '{domain_id}' not found.",
        )

    bot = domain.chat_bot
    helpdesk_enabled = bot.helpdesk if bot else False

    # Fetch HelpDesk FAQs if enabled
    faqs: List[ChatbotFAQItem] = []
    if helpdesk_enabled:
        faq_stmt = (
            select(HelpDesk)
            .where(HelpDesk.domain_id == domain_id)
            .order_by(HelpDesk.created_at.asc())
        )
        faq_res = await db.execute(faq_stmt)
        faqs = [
            ChatbotFAQItem(id=f.id, question=f.question, answer=f.answer)
            for f in faq_res.scalars().all()
        ]

    # Fetch domain products for the catalog tab
    prod_stmt = (
        select(Product)
        .where(Product.domain_id == domain_id)
        .order_by(Product.created_at.desc())
        .limit(20)
    )
    prod_res = await db.execute(prod_stmt)
    products = [
        ChatbotProductItem(id=p.id, name=p.name, price=p.price, image=p.image)
        for p in prod_res.scalars().all()
    ]

    return ChatbotConfigResponse(
        domain_id=domain.id,
        domain_name=domain.name,
        welcome_message=bot.welcome_message if bot and bot.welcome_message else "Hey there, have a question? Text us here",
        icon=bot.icon if bot else None,
        background=bot.background if bot else None,
        text_color=bot.text_color if bot else None,
        helpdesk_enabled=helpdesk_enabled,
        faqs=faqs,
        products=products,
    )


@router.post(
    "/{domain_id}/message",
    response_model=ChatbotMessageResponse,
    summary="Send Chat Message to AI Sales Bot",
    description="Public API to process messages from widget, execute RAG retrieval, manage lead state machine, and generate intelligent sales responses.",
)
async def send_chatbot_message(
    domain_id: uuid.UUID,
    payload: ChatbotMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await process_ai_chat(
        db=db,
        domain_id=domain_id,
        message=payload.message,
        chat_history=payload.chat_history,
        customer_email=payload.customer_email,
        chatroom_id=payload.chatroom_id,
    )

    return ChatbotMessageResponse(
        id=result.get("id"),
        role=result["role"],
        message=result["message"],
        raw_message=result.get("raw_message"),
        live=result["live"],
        customer_id=result.get("customer_id"),
        chatroom_id=result.get("chatroom_id"),
        link=result.get("link"),
        has_complete=result.get("has_complete", False),
        has_realtime=result.get("has_realtime", False),
        credits_remaining=result.get("credits_remaining"),
    )


@router.get(
    "/{domain_id}/history/{chatroom_id}",
    response_model=ChatSessionHistoryResponse,
    summary="Get Chat History for Session",
    description="Public API to retrieve past chat messages for a specific chatroom session.",
)
async def get_session_chat_history(
    domain_id: uuid.UUID,
    chatroom_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ChatRoom)
        .options(selectinload(ChatRoom.messages))
        .where(ChatRoom.id == chatroom_id)
    )
    result = await db.execute(stmt)
    chatroom = result.scalar_one_or_none()

    if not chatroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chat session '{chatroom_id}' not found.",
        )

    messages = [
        ChatMessageHistoryItem(
            id=m.id,
            role=m.role.value if hasattr(m.role, "value") else str(m.role or "user"),
            message=re.sub(r"\((?:complete|realtime)\)", "", m.message, flags=re.IGNORECASE).strip(),
            seen=m.seen,
            created_at=m.created_at,
        )
        for m in chatroom.messages
    ]

    return ChatSessionHistoryResponse(
        chatroom_id=chatroom.id,
        live=chatroom.live,
        messages=messages,
    )
