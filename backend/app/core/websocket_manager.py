import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import WebSocket

logger = logging.getLogger("replyease.websocket")


class ConnectionManager:
    """
    Manages active WebSocket connections grouped by chat room ID.
    Provides methods for connecting, disconnecting, and broadcasting messages.
    """

    def __init__(self) -> None:
        # Key: room_id (str), Value: list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str) -> None:
        """
        Accept an incoming WebSocket connection and register it to the specified room.
        """
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        logger.info(
            f"[WebSocket] Connected to room {room_id}. Total connections in room: {len(self.active_connections[room_id])}"
        )

    def disconnect(self, websocket: WebSocket, room_id: str) -> None:
        """
        Remove a WebSocket connection from the room upon disconnect.
        """
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
                logger.info(
                    f"[WebSocket] Disconnected from room {room_id}. Remaining: {len(self.active_connections[room_id])}"
                )
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_to_room(self, room_id: str, message: Dict[str, Any]) -> None:
        """
        Broadcast a JSON payload to all active clients currently connected to the room.
        Safely removes any stale or closed connections encountered during transmission.
        """
        if room_id not in self.active_connections:
            logger.debug(f"[WebSocket] No active listeners in room {room_id} for broadcast")
            return

        dead_connections: List[WebSocket] = []
        # Copy list to prevent mutation during iteration
        sockets = list(self.active_connections[room_id])

        for connection in sockets:
            try:
                await connection.send_json(message)
            except Exception as exc:
                logger.warning(f"[WebSocket] Error sending message to connection in room {room_id}: {exc}")
                dead_connections.append(connection)

        # Cleanup dead connections
        for dead in dead_connections:
            self.disconnect(dead, room_id)

    async def send_personal_message(self, websocket: WebSocket, message: Dict[str, Any]) -> None:
        """
        Send a JSON payload directly to a single WebSocket client.
        """
        try:
            await websocket.send_json(message)
        except Exception as exc:
            logger.warning(f"[WebSocket] Failed to send personal message: {exc}")

    def get_room_clients_count(self, room_id: str) -> int:
        """
        Return the number of active clients in a given room.
        """
        return len(self.active_connections.get(room_id, []))


# Global singleton instance
websocket_manager = ConnectionManager()
