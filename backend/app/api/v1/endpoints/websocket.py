import json
import logging
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import update
from app.core.database import AsyncSessionLocal
from app.core.websocket_manager import websocket_manager
from app.models.chat_message import ChatMessage
from app.models.chatroom import ChatRoom
from app.models.enums import Role

logger = logging.getLogger("replyease.websocket")

router = APIRouter()


@router.websocket("/ws/chat/{room_id}")
async def chat_websocket_endpoint(websocket: WebSocket, room_id: str):
    """
    Bi-directional Real-Time WebSocket endpoint for chat rooms.
    Connected clients (website owner on Dashboard and visitor on Chatbot widget)
    receive instant updates regarding new messages, live takeover mode, and typing status.
    """
    clean_room_id = room_id.strip()
    await websocket_manager.connect(websocket, clean_room_id)

    # Send handshake confirmation
    await websocket_manager.send_personal_message(
        websocket,
        {
            "type": "connected",
            "room_id": clean_room_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": "Kết nối WebSocket thời gian thực thành công.",
        },
    )

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                payload = json.loads(raw_data)
            except json.JSONDecodeError:
                payload = {"type": "text", "content": raw_data}

            msg_type = payload.get("type", "message")

            # Handle heartbeat ping
            if msg_type == "ping":
                await websocket_manager.send_personal_message(
                    websocket,
                    {"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()},
                )
                continue

            # Handle typing indicator broadcast
            if msg_type in ["typing_start", "typing_stop"]:
                sender_role = payload.get("role", "assistant")
                await websocket_manager.broadcast_to_room(
                    clean_room_id,
                    {
                        "type": msg_type,
                        "room_id": clean_room_id,
                        "role": sender_role,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
                continue

            # Handle generic broadcast requests
            if msg_type == "broadcast":
                event_data = payload.get("data", {})
                await websocket_manager.broadcast_to_room(
                    clean_room_id,
                    {
                        "type": payload.get("event", "message"),
                        "room_id": clean_room_id,
                        "data": event_data,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
                continue

            # Handle direct incoming chat message via WebSocket
            if msg_type in ["message", "new_message", "chat"] or "message" in payload or "content" in payload:
                text_content = ""
                role_val = payload.get("role", "assistant")

                raw_msg_data = payload.get("message") or payload.get("content") or payload.get("text")
                if isinstance(raw_msg_data, dict):
                    text_content = str(raw_msg_data.get("message") or raw_msg_data.get("content") or "").strip()
                    role_val = raw_msg_data.get("role", role_val)
                elif isinstance(raw_msg_data, str):
                    text_content = raw_msg_data.strip()

                if text_content:
                    try:
                        r_uuid = uuid.UUID(clean_room_id)
                        db_role = Role.user if str(role_val).lower() == "user" else Role.assistant
                        async with AsyncSessionLocal() as db_session:
                            new_chat_msg = ChatMessage(
                                id=uuid.uuid4(),
                                message=text_content,
                                role=db_role,
                                seen=(db_role == Role.assistant),
                                chat_room_id=r_uuid,
                            )
                            db_session.add(new_chat_msg)
                            await db_session.execute(
                                update(ChatRoom)
                                .where(ChatRoom.id == r_uuid)
                                .values(updated_at=datetime.now(timezone.utc))
                            )
                            await db_session.commit()

                            # Broadcast to the room
                            await websocket_manager.broadcast_to_room(
                                clean_room_id,
                                {
                                    "type": "new_message",
                                    "room_id": clean_room_id,
                                    "message": {
                                        "id": str(new_chat_msg.id),
                                        "message": new_chat_msg.message,
                                        "role": new_chat_msg.role.value if hasattr(new_chat_msg.role, "value") else str(new_chat_msg.role),
                                        "seen": new_chat_msg.seen,
                                        "chat_room_id": clean_room_id,
                                        "created_at": datetime.now(timezone.utc).isoformat(),
                                    },
                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                },
                            )
                    except Exception as save_err:
                        logger.error(f"[WebSocket] Error persisting message in room {clean_room_id}: {save_err}")
                continue

    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, clean_room_id)
        logger.info(f"[WebSocket] Client disconnected from room {clean_room_id}")
    except Exception as exc:
        logger.error(f"[WebSocket] Unexpected exception in room {clean_room_id}: {exc}")
        websocket_manager.disconnect(websocket, clean_room_id)
