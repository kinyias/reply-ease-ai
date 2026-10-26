import pytest
import pytest_asyncio
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.websocket_manager import ConnectionManager


@pytest.mark.asyncio
async def test_connection_manager_lifecycle():
    manager = ConnectionManager()
    room_id = str(uuid.uuid4())

    assert manager.get_room_clients_count(room_id) == 0

    # Mock websocket
    class MockWebSocket:
        def __init__(self):
            self.accepted = False
            self.sent_messages = []

        async def accept(self):
            self.accepted = True

        async def send_json(self, data):
            self.sent_messages.append(data)

    ws1 = MockWebSocket()
    ws2 = MockWebSocket()

    await manager.connect(ws1, room_id)
    assert ws1.accepted is True
    assert manager.get_room_clients_count(room_id) == 1

    await manager.connect(ws2, room_id)
    assert manager.get_room_clients_count(room_id) == 2

    # Broadcast message
    test_msg = {"type": "new_message", "content": "Hello Realtime"}
    await manager.broadcast_to_room(room_id, test_msg)

    assert len(ws1.sent_messages) == 1
    assert ws1.sent_messages[0] == test_msg
    assert len(ws2.sent_messages) == 1
    assert ws2.sent_messages[0] == test_msg

    # Disconnect one
    manager.disconnect(ws1, room_id)
    assert manager.get_room_clients_count(room_id) == 1

    # Disconnect second
    manager.disconnect(ws2, room_id)
    assert manager.get_room_clients_count(room_id) == 0


def test_websocket_fastapi_endpoint():
    client = TestClient(app)
    room_id = str(uuid.uuid4())

    with client.websocket_connect(f"/ws/chat/{room_id}") as websocket:
        # Handshake confirmation
        handshake = websocket.receive_json()
        assert handshake["type"] == "connected"
        assert handshake["room_id"] == room_id

        # Ping pong test
        websocket.send_json({"type": "ping"})
        pong = websocket.receive_json()
        assert pong["type"] == "pong"
