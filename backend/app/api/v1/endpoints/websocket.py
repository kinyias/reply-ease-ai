import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import websocket_manager

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

    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, clean_room_id)
        logger.info(f"[WebSocket] Client disconnected from room {clean_room_id}")
    except Exception as exc:
        logger.error(f"[WebSocket] Unexpected exception in room {clean_room_id}: {exc}")
        websocket_manager.disconnect(websocket, clean_room_id)
