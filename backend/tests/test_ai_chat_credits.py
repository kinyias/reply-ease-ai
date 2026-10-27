import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.main import app
from app.models.billing import Billings
from app.models.chatbot import ChatBot
from app.models.chatroom import ChatRoom
from app.models.domain import Domain
from app.models.enums import Plans
from app.models.user import User
from app.services.ai_bot_service import process_ai_chat


@pytest.mark.asyncio
async def test_process_ai_chat_deducts_one_credit():
    async with AsyncSessionLocal() as session:
        user_id = uuid.uuid4()
        test_user = User(
            id=user_id,
            fullname="Shop Owner",
            email=f"owner_{user_id.hex[:6]}@example.com",
            hashed_password="fake_hashed_pw",
            type="owner",
        )
        test_billing = Billings(
            id=uuid.uuid4(),
            user_id=user_id,
            plan=Plans.STANDARD,
            credits=100,
        )
        test_domain = Domain(
            id=uuid.uuid4(),
            name=f"shop_{user_id.hex[:6]}.com",
            icon="https://example.com/icon.png",
            user_id=user_id,
        )
        test_bot = ChatBot(
            id=uuid.uuid4(),
            domain_id=test_domain.id,
            welcome_message="Xin chào quý khách!",
        )
        session.add_all([test_user, test_billing, test_domain, test_bot])
        await session.commit()

        # Call process_ai_chat
        result = await process_ai_chat(
            db=session,
            domain_id=test_domain.id,
            message="Xin chào, shop có bán áo thun không?",
        )

        assert result["role"] == "assistant"
        assert result["credits_remaining"] == 99

        # Verify DB credits decremented to 99
        bill_stmt = select(Billings).where(Billings.user_id == user_id)
        bill_res = await session.execute(bill_stmt)
        updated_billing = bill_res.scalar_one()
        assert updated_billing.credits == 99


@pytest.mark.asyncio
async def test_process_ai_chat_credits_exhausted_fallback_to_live():
    async with AsyncSessionLocal() as session:
        user_id = uuid.uuid4()
        test_user = User(
            id=user_id,
            fullname="Broke Owner",
            email=f"broke_{user_id.hex[:6]}@example.com",
            hashed_password="fake_hashed_pw",
            type="owner",
        )
        test_billing = Billings(
            id=uuid.uuid4(),
            user_id=user_id,
            plan=Plans.STANDARD,
            credits=0,  # 0 credits remaining
        )
        test_domain = Domain(
            id=uuid.uuid4(),
            name=f"zero_{user_id.hex[:6]}.com",
            icon="https://example.com/icon.png",
            user_id=user_id,
        )
        test_bot = ChatBot(
            id=uuid.uuid4(),
            domain_id=test_domain.id,
            welcome_message="Chào bạn!",
        )
        session.add_all([test_user, test_billing, test_domain, test_bot])
        await session.commit()

        # Call process_ai_chat when 0 credits
        result = await process_ai_chat(
            db=session,
            domain_id=test_domain.id,
            message="Tôi muốn mua hàng gấp!",
        )

        # Must switch to live, report 0 credits, and show friendly takeover message
        assert result["live"] is True
        assert result["credits_remaining"] == 0
        assert "tạm thời hết lượt phản hồi" in result["message"]
        assert result["has_realtime"] is True

        # Verify DB billing credits stays at 0 (not negative)
        bill_stmt = select(Billings).where(Billings.user_id == user_id)
        bill_res = await session.execute(bill_stmt)
        updated_billing = bill_res.scalar_one()
        assert updated_billing.credits == 0

        # Verify ChatRoom was created and marked live=True
        if result.get("chatroom_id"):
            room_stmt = select(ChatRoom).where(ChatRoom.id == uuid.UUID(result["chatroom_id"]))
            room_res = await session.execute(room_stmt)
            room = room_res.scalar_one_or_none()
            assert room is not None
            assert room.live is True
