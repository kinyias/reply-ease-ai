import logging
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.websocket_manager import websocket_manager
from app.models.chat_message import ChatMessage
from app.models.chatroom import ChatRoom
from app.models.customer import Customer
from app.models.customer_response import CustomerResponses
from app.models.domain import Domain
from app.models.enums import Role
from app.schemas.conversation import (
    ChatMessageResponse,
    ChatRoomSummary,
    ConversationListResponse,
    CustomerBrief,
    MarkSeenResponse,
    ToggleRealtimeResponse,
)

logger = logging.getLogger("replyease.conversations")


async def _verify_domain_ownership(
    db: AsyncSession, user_id: uuid.UUID, domain_id: uuid.UUID
) -> Domain:
    """Verify that domain exists and belongs to the given user."""
    stmt = select(Domain).where(Domain.id == domain_id, Domain.user_id == user_id)
    res = await db.execute(stmt)
    domain = res.scalar_one_or_none()
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain không tồn tại hoặc bạn không có quyền truy cập.",
        )
    return domain


async def _verify_room_ownership(
    db: AsyncSession, user_id: uuid.UUID, room_id: uuid.UUID
) -> ChatRoom:
    """Verify that the chatroom exists and belongs to a domain owned by user."""
    stmt = (
        select(ChatRoom)
        .join(Customer, ChatRoom.customer_id == Customer.id)
        .join(Domain, Customer.domain_id == Domain.id)
        .where(ChatRoom.id == room_id, Domain.user_id == user_id)
        .options(
            selectinload(ChatRoom.customer).selectinload(Customer.domain),
            selectinload(ChatRoom.customer).selectinload(Customer.questions),
            selectinload(ChatRoom.messages),
        )
    )
    res = await db.execute(stmt)
    room = res.scalar_one_or_none()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phòng chat không tồn tại hoặc bạn không có quyền truy cập.",
        )
    return room


async def get_domain_conversations(
    db: AsyncSession,
    user_id: uuid.UUID,
    domain_id: Optional[uuid.UUID] = None,
    tab: str = "all",
    search: Optional[str] = None,
) -> ConversationListResponse:
    """
    Fetch all chatrooms belonging to user's domains, with unread counters,
    urgency status, filter questions answered metrics, and search/tab filtering.
    """
    # 1. Determine which domains to query
    if domain_id:
        await _verify_domain_ownership(db, user_id, domain_id)
        domain_ids = [domain_id]
    else:
        domain_stmt = select(Domain.id).where(Domain.user_id == user_id)
        d_res = await db.execute(domain_stmt)
        domain_ids = [row[0] for row in d_res.all()]

    if not domain_ids:
        return ConversationListResponse(
            rooms=[], total=0, unread_total=0, live_total=0, urgent_total=0
        )

    # 2. Query chat rooms with eager loading
    stmt = (
        select(ChatRoom)
        .join(Customer, ChatRoom.customer_id == Customer.id)
        .where(Customer.domain_id.in_(domain_ids))
        .options(
            selectinload(ChatRoom.customer).selectinload(Customer.domain),
            selectinload(ChatRoom.customer).selectinload(Customer.questions),
            selectinload(ChatRoom.messages),
        )
        .order_by(ChatRoom.updated_at.desc())
    )

    res = await db.execute(stmt)
    raw_rooms = res.scalars().all()

    now = datetime.now(timezone.utc)
    two_hours_ago = now - timedelta(hours=2)
    seven_days_ago = now - timedelta(days=7)

    all_summaries: List[ChatRoomSummary] = []
    total_unread = 0
    total_live = 0
    total_urgent = 0

    clean_search = search.strip().lower() if search else None

    for room in raw_rooms:
        cust = room.customer
        domain = cust.domain if cust else None

        # Sort messages
        sorted_messages = sorted(room.messages, key=lambda m: m.created_at) if room.messages else []
        last_msg = sorted_messages[-1] if sorted_messages else None

        # Calculate unread count (messages sent by user and not seen)
        unread_count = sum(1 for m in sorted_messages if m.role == Role.user and not m.seen)
        if unread_count > 0:
            total_unread += 1

        if room.live:
            total_live += 1

        # Determine urgency:
        # If room is live, OR if there are unread messages sent within last 2 hours
        is_urgent = False
        if room.live:
            is_urgent = True
        elif unread_count > 0 and last_msg and last_msg.created_at:
            # Ensure timezone awareness for comparison
            msg_time = last_msg.created_at
            if msg_time.tzinfo is None:
                msg_time = msg_time.replace(tzinfo=timezone.utc)
            if msg_time >= two_hours_ago:
                is_urgent = True

        if is_urgent:
            total_urgent += 1

        # Customer brief
        cust_brief = None
        if cust:
            answered_q = sum(1 for q in cust.questions if q.answered is not None)
            total_q = len(cust.questions)
            cust_brief = CustomerBrief(
                id=cust.id,
                email=cust.email,
                created_at=cust.created_at,
                answered_questions_count=answered_q,
                total_questions_count=total_q,
            )

        last_msg_resp = None
        if last_msg:
            last_msg_resp = ChatMessageResponse.model_validate(last_msg)

        summary = ChatRoomSummary(
            id=room.id,
            domain_id=domain.id if domain else uuid.UUID(int=0),
            domain_name=domain.name if domain else "Unknown Domain",
            live=room.live,
            mailed=room.mailed,
            customer=cust_brief,
            last_message=last_msg_resp,
            unread_count=unread_count,
            is_urgent=is_urgent,
            created_at=room.created_at,
            updated_at=room.updated_at,
        )

        # Tab filtering
        matches_tab = True
        if tab == "unread":
            matches_tab = unread_count > 0
        elif tab == "urgent":
            matches_tab = is_urgent
        elif tab == "live":
            matches_tab = room.live
        elif tab == "expired":
            # Expired if last activity was > 7 days ago
            room_time = room.updated_at
            if room_time.tzinfo is None:
                room_time = room_time.replace(tzinfo=timezone.utc)
            matches_tab = room_time < seven_days_ago
        # tab == "all" keeps all

        if not matches_tab:
            continue

        # Search filtering
        if clean_search:
            email_match = cust and cust.email and clean_search in cust.email.lower()
            last_msg_match = last_msg and clean_search in last_msg.message.lower()
            domain_match = domain and clean_search in domain.name.lower()
            if not (email_match or last_msg_match or domain_match):
                continue

        all_summaries.append(summary)

    return ConversationListResponse(
        rooms=all_summaries,
        total=len(all_summaries),
        unread_total=total_unread,
        live_total=total_live,
        urgent_total=total_urgent,
    )


async def get_room_messages(
    db: AsyncSession, user_id: uuid.UUID, room_id: uuid.UUID
) -> List[ChatMessageResponse]:
    """Fetch complete chat message history for an authorized chatroom."""
    await _verify_room_ownership(db, user_id, room_id)

    stmt = (
        select(ChatMessage)
        .where(ChatMessage.chat_room_id == room_id)
        .order_by(ChatMessage.created_at.asc())
    )
    res = await db.execute(stmt)
    messages = res.scalars().all()

    res_list: List[ChatMessageResponse] = []
    for m in messages:
        clean_text = re.sub(r"\((?:complete|realtime)\)", "", m.message, flags=re.IGNORECASE).strip()
        res_list.append(
            ChatMessageResponse(
                id=m.id,
                message=clean_text,
                role=m.role,
                seen=m.seen,
                chat_room_id=m.chat_room_id,
                created_at=m.created_at,
                updated_at=m.updated_at,
            )
        )
    return res_list


async def mark_room_seen(
    db: AsyncSession, user_id: uuid.UUID, room_id: uuid.UUID
) -> MarkSeenResponse:
    """Mark all unread user messages in the room as seen."""
    room = await _verify_room_ownership(db, user_id, room_id)

    stmt = (
        update(ChatMessage)
        .where(ChatMessage.chat_room_id == room_id, ChatMessage.seen.is_(False))
        .values(seen=True)
    )
    res = await db.execute(stmt)
    await db.commit()

    # Broadcast read receipt to room clients
    await websocket_manager.broadcast_to_room(
        str(room_id),
        {
            "type": "messages_seen",
            "room_id": str(room_id),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    return MarkSeenResponse(
        room_id=room.id,
        seen_count=res.rowcount or 0,
        message="Đã đánh dấu đã đọc toàn bộ tin nhắn trong phòng.",
    )


async def toggle_realtime_mode(
    db: AsyncSession, user_id: uuid.UUID, room_id: uuid.UUID, live: bool
) -> ToggleRealtimeResponse:
    """Toggle the live human-in-the-loop takeover mode for a chatroom."""
    room = await _verify_room_ownership(db, user_id, room_id)

    room.live = live
    room.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # Broadcast live status change to both dashboard and chatbot widget
    await websocket_manager.broadcast_to_room(
        str(room_id),
        {
            "type": "live_mode_toggled",
            "room_id": str(room_id),
            "live": live,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    action_label = "kích hoạt" if live else "tắt"
    return ToggleRealtimeResponse(
        room_id=room.id,
        live=room.live,
        message=f"Đã {action_label} chế độ tư vấn trực tiếp (Live Mode).",
    )


async def send_assistant_message(
    db: AsyncSession, user_id: uuid.UUID, room_id: uuid.UUID, message_text: str
) -> ChatMessageResponse:
    """
    Send an owner/assistant reply from the Dashboard Messenger window,
    persist to database, and broadcast immediately over WebSocket to the customer.
    """
    room = await _verify_room_ownership(db, user_id, room_id)

    clean_text = message_text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nội dung tin nhắn không được để trống.",
        )

    new_msg = ChatMessage(
        id=uuid.uuid4(),
        message=clean_text,
        role=Role.assistant,
        seen=True,
        chat_room_id=room.id,
    )
    db.add(new_msg)

    # Touch chatroom updated_at
    room.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(new_msg)

    # Broadcast message to WebSocket clients in this room (customer widget)
    msg_payload = {
        "id": str(new_msg.id),
        "message": new_msg.message,
        "role": "assistant",
        "seen": new_msg.seen,
        "chat_room_id": str(new_msg.chat_room_id),
        "created_at": new_msg.created_at.isoformat(),
    }

    await websocket_manager.broadcast_to_room(
        str(room.id),
        {
            "type": "new_message",
            "room_id": str(room.id),
            "message": msg_payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    logger.info(f"[Messenger] Assistant sent message in room {room_id}: '{clean_text[:40]}...'")

    return ChatMessageResponse.model_validate(new_msg)
