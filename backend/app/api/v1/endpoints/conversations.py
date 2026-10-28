import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.conversation import (
    ChatMessageResponse,
    ConversationListResponse,
    MarkSeenResponse,
    SendMessageRequest,
    ToggleRealtimeRequest,
    ToggleRealtimeResponse,
)
from app.services import conversation_service

router = APIRouter()


@router.get("", response_model=ConversationListResponse, summary="Lấy danh sách hội thoại của toàn bộ domain")
async def list_all_conversations(
    tab: str = Query("all", description="Lọc theo tab: all, unread, urgent, live, expired"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo email khách hàng hoặc nội dung tin nhắn"),
    page: Optional[int] = Query(None, ge=1, description="Số trang (bắt đầu từ 1)"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Số lượng hội thoại mỗi trang"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lấy danh sách các phòng chat thuộc mọi domain mà người dùng đang sở hữu.
    Hỗ trợ phân loại theo tab (Tất cả, Chưa đọc, Khẩn cấp, Live Mode, Hết hạn), tìm kiếm nhanh và phân trang.
    """
    return await conversation_service.get_domain_conversations(
        db=db,
        user_id=current_user.id,
        domain_id=None,
        tab=tab,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/domains/{domain_id}",
    response_model=ConversationListResponse,
    summary="Lấy danh sách hội thoại theo domain",
)
async def list_domain_conversations(
    domain_id: uuid.UUID,
    tab: str = Query("all", description="Lọc theo tab: all, unread, urgent, live, expired"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo email khách hàng hoặc nội dung tin nhắn"),
    page: Optional[int] = Query(None, ge=1, description="Số trang (bắt đầu từ 1)"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Số lượng hội thoại mỗi trang"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lấy danh sách các phòng chat của một domain cụ thể.
    Trả về kèm số lượng tin nhắn chưa đọc, trạng thái khẩn cấp, câu hỏi sàng lọc đã trả lời và tin nhắn mới nhất.
    """
    return await conversation_service.get_domain_conversations(
        db=db,
        user_id=current_user.id,
        domain_id=domain_id,
        tab=tab,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/rooms/{room_id}/messages",
    response_model=List[ChatMessageResponse],
    summary="Lấy lịch sử tin nhắn của một phòng chat",
)
async def get_room_messages(
    room_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lấy toàn bộ lịch sử tin nhắn trong phòng chat sắp xếp theo thời gian tăng dần.
    """
    return await conversation_service.get_room_messages(
        db=db,
        user_id=current_user.id,
        room_id=room_id,
    )


@router.put(
    "/rooms/{room_id}/seen",
    response_model=MarkSeenResponse,
    summary="Đánh dấu đã đọc toàn bộ tin nhắn trong phòng",
)
async def mark_room_seen(
    room_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Đánh dấu tất cả tin nhắn của khách hàng trong phòng là đã đọc (seen = True).
    Phát thông báo WebSocket tới phòng chat.
    """
    return await conversation_service.mark_room_seen(
        db=db,
        user_id=current_user.id,
        room_id=room_id,
    )


@router.put(
    "/rooms/{room_id}/toggle-realtime",
    response_model=ToggleRealtimeResponse,
    summary="Bật/Tắt chế độ can thiệp người thật (Live Mode)",
)
async def toggle_realtime(
    room_id: uuid.UUID,
    payload: ToggleRealtimeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Bật hoặc tắt cờ Live Mode cho phòng chat.
    Khi bật (live = True), bot AI sẽ dừng phản hồi tự động để chủ website trực tiếp tư vấn.
    Đồng bộ tức thời qua WebSocket cho cả Widget khách hàng và Dashboard.
    """
    return await conversation_service.toggle_realtime_mode(
        db=db,
        user_id=current_user.id,
        room_id=room_id,
        live=payload.live,
    )


@router.post(
    "/rooms/{room_id}/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Chủ website gửi tin nhắn trực tiếp cho khách hàng",
)
async def send_message_to_customer(
    room_id: uuid.UUID,
    payload: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Chủ sở hữu website gửi tin nhắn trả lời trực tiếp cho khách hàng từ Dashboard.
    Lưu vào cơ sở dữ liệu với role 'assistant' và phát ngay qua WebSocket tới Widget của khách hàng.
    """
    return await conversation_service.send_assistant_message(
        db=db,
        user_id=current_user.id,
        room_id=room_id,
        message_text=payload.message,
    )
