import asyncio
import os
import sys
import uuid

# Add parent directory to path so imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.main import app
from app.models.chatbot import ChatBot
from app.models.chatroom import ChatRoom
from app.models.customer import Customer
from app.models.customer_response import CustomerResponses
from app.models.domain import Domain
from app.models.filter_question import FilterQuestions
from app.models.helpdesk import HelpDesk
from app.models.product import Product
from app.models.user import User
from app.services import vector_service


async def verify_phase_4():
    print("==================================================")
    print("🚀 [PHASE 4 VERIFICATION] AI Sales Bot & Chatbot API")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        # 1. Setup a test User, Domain, ChatBot, FilterQuestions, HelpDesk, and Product
        user_stmt = select(User).limit(1)
        user_res = await db.execute(user_stmt)
        user = user_res.scalar_one_or_none()

        if not user:
            print("❌ No test user found. Please run earlier phase migrations/seeds.")
            return

        test_domain = Domain(
            id=uuid.uuid4(),
            name=f"test-shop-{uuid.uuid4().hex[:6]}.com",
            icon="https://example.com/icon.png",
            user_id=user.id,
        )
        db.add(test_domain)
        await db.flush()

        test_bot = ChatBot(
            id=uuid.uuid4(),
            welcome_message="Chào mừng bạn đến với shop! Hãy hỏi tôi bất cứ điều gì.",
            icon="https://example.com/bot-avatar.png",
            background="#ff7a00",
            text_color="#ffffff",
            helpdesk=True,
            domain_id=test_domain.id,
        )
        db.add(test_bot)

        # Add Filter Questions
        fq1 = FilterQuestions(
            id=uuid.uuid4(),
            question="Ngân sách dự kiến của bạn khoảng bao nhiêu?",
            domain_id=test_domain.id,
        )
        fq2 = FilterQuestions(
            id=uuid.uuid4(),
            question="Bạn dự định triển khai trong thời gian nào?",
            domain_id=test_domain.id,
        )
        db.add_all([fq1, fq2])

        # Add HelpDesk FAQ
        hd1 = HelpDesk(
            id=uuid.uuid4(),
            question="Chính sách bảo hành như thế nào?",
            answer="Bảo hành 1 đổi 1 trong vòng 12 tháng tại mọi chi nhánh trên toàn quốc.",
            domain_id=test_domain.id,
        )
        db.add(hd1)

        # Add Product
        p1 = Product(
            id=uuid.uuid4(),
            name="Gói Dịch Vụ Cao Cấp",
            price=1500000,
            image="https://example.com/product.png",
            domain_id=test_domain.id,
        )
        db.add(p1)

        await db.commit()
        domain_id = test_domain.id
        print(f"✅ Created test domain: {test_domain.name} (ID: {domain_id})")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # TEST 1: Vector Service check
        print("\n--- TEST 1: Vector & RAG Service ---")
        emb = vector_service.get_embedding("Xin chào trợ lý ảo")
        assert len(emb) == 768, f"Expected 768-dim embedding, got {len(emb)}"
        print(f"✅ Embedding generated successfully (dimensions: {len(emb)})")

        upsert_res = await vector_service.upsert_knowledge(
            domain_id=domain_id,
            record_id=uuid.uuid4(),
            text="Gói Dịch Vụ Cao Cấp 1,500,000 VND",
            metadata={"type": "product"},
        )
        print(f"✅ Upsert knowledge executed (status: {upsert_res})")

        rag_results = await vector_service.query_knowledge(
            domain_id=domain_id,
            query="Có gói dịch vụ cao cấp không?",
            top_k=2,
        )
        print(f"✅ Query knowledge returned {len(rag_results)} matches")

        # TEST 2: GET /api/v1/chatbot/{domain_id}/config
        print("\n--- TEST 2: GET Public Chatbot Config ---")
        resp = await client.get(f"/api/v1/chatbot/{domain_id}/config")
        assert resp.status_code == 200, f"Config error: {resp.text}"
        data = resp.json()
        assert data["domain_id"] == str(domain_id)
        assert data["welcome_message"] == "Chào mừng bạn đến với shop! Hãy hỏi tôi bất cứ điều gì."
        assert data["helpdesk_enabled"] is True
        assert len(data["faqs"]) == 1
        assert data["faqs"][0]["question"] == "Chính sách bảo hành như thế nào?"
        assert len(data["products"]) == 1
        assert data["products"][0]["name"] == "Gói Dịch Vụ Cao Cấp"
        print(f"✅ Chatbot Config API returned correct branding, FAQs, and Products: {data['domain_name']}")

        # TEST 3: Regex Email Extraction & Lead Creation
        print("\n--- TEST 3: Message with Email -> Customer & CustomerResponses created ---")
        customer_email = f"lead_{uuid.uuid4().hex[:6]}@gmail.com"
        msg_payload = {
            "message": f"Chào bạn, tôi muốn tìm hiểu thêm về dịch vụ, email của tôi là {customer_email}",
            "chat_history": [],
        }
        msg_resp = await client.post(f"/api/v1/chatbot/{domain_id}/message", json=msg_payload)
        assert msg_resp.status_code == 200, f"Message error: {msg_resp.text}"
        res_data = msg_resp.json()
        assert res_data["role"] == "assistant"
        assert res_data["customer_id"] is not None
        assert res_data["chatroom_id"] is not None
        customer_id = res_data["customer_id"]
        chatroom_id = res_data["chatroom_id"]
        print(f"✅ Extracted email successfully! Created Customer ID: {customer_id}, Room: {chatroom_id}")
        print(f"   AI reply: {res_data['message'][:100]}...")

        # Verify Customer & CustomerResponses in DB
        async with AsyncSessionLocal() as db:
            cust = await db.scalar(
                select(Customer)
                .options(selectinload(Customer.questions))
                .where(Customer.id == uuid.UUID(customer_id))
            )
            assert cust is not None
            assert cust.email == customer_email
            assert len(cust.questions) == 2, f"Expected 2 cloned filter questions, got {len(cust.questions)}"
            print(f"✅ Database verified: Customer exists with {len(cust.questions)} cloned filter questions")

        # TEST 4: Keyword Tracking (complete) -> CustomerResponses.answered updated
        print("\n--- TEST 4: (complete) Keyword Tracking -> Answer recorded ---")
        answer_payload = {
            "message": "Ngân sách của tôi tầm 50 triệu",
            "chat_history": [
                {"role": "user", "message": f"email của tôi là {customer_email}"},
                {"role": "assistant", "message": "Ngân sách dự kiến của bạn khoảng bao nhiêu? (complete)"},
            ],
            "customer_email": customer_email,
            "chatroom_id": chatroom_id,
        }
        ans_resp = await client.post(f"/api/v1/chatbot/{domain_id}/message", json=answer_payload)
        assert ans_resp.status_code == 200
        print("✅ Message processed with previous (complete) turn.")

        async with AsyncSessionLocal() as db:
            ans_res = await db.execute(
                select(CustomerResponses)
                .where(
                    CustomerResponses.customer_id == uuid.UUID(customer_id),
                    CustomerResponses.answered.is_not(None),
                )
            )
            answered_questions = ans_res.scalars().all()
            assert len(answered_questions) >= 1
            print(f"✅ Filter question answer successfully saved in DB: '{answered_questions[0].question}' -> '{answered_questions[0].answered}'")

        # TEST 5: Escalation (realtime) -> ChatRoom.live = True
        print("\n--- TEST 5: Escalation (realtime) -> ChatRoom switches to Live Mode ---")
        escalate_payload = {
            "message": "Tôi muốn gặp trực tiếp nhân viên tư vấn người thật để khiếu nại!",
            "chat_history": [],
            "customer_email": customer_email,
            "chatroom_id": chatroom_id,
        }
        esc_resp = await client.post(f"/api/v1/chatbot/{domain_id}/message", json=escalate_payload)
        assert esc_resp.status_code == 200
        esc_data = esc_resp.json()
        assert esc_data["live"] is True or esc_data["has_realtime"] is True
        print(f"✅ Live escalation triggered! Response live flag: {esc_data['live']}")

        async with AsyncSessionLocal() as db:
            room = await db.scalar(select(ChatRoom).where(ChatRoom.id == uuid.UUID(chatroom_id)))
            assert room.live is True
            print(f"✅ ChatRoom live state in database: {room.live}")

        # TEST 6: Subsequent message when Live Mode is ON -> AI holds off, human queue active
        print("\n--- TEST 6: ChatRoom.live is ON -> AI remains silent, message queued ---")
        hold_payload = {
            "message": "Alo alo có ai ở đó không?",
            "chat_history": [],
            "customer_email": customer_email,
            "chatroom_id": chatroom_id,
        }
        hold_resp = await client.post(f"/api/v1/chatbot/{domain_id}/message", json=hold_payload)
        assert hold_resp.status_code == 200
        hold_data = hold_resp.json()
        assert hold_data["live"] is True
        assert "trực tiếp" in hold_data["message"] or "phòng chat" in hold_data["message"].lower()
        print(f"✅ Live mode guarded AI correctly: '{hold_data['message']}'")

        # TEST 7: GET /api/v1/chatbot/{domain_id}/history/{chatroom_id}
        print("\n--- TEST 7: GET Session Chat History ---")
        hist_resp = await client.get(f"/api/v1/chatbot/{domain_id}/history/{chatroom_id}")
        assert hist_resp.status_code == 200
        hist_data = hist_resp.json()
        assert hist_data["chatroom_id"] == chatroom_id
        assert len(hist_data["messages"]) >= 2
        print(f"✅ Session history retrieved {len(hist_data['messages'])} messages successfully!")

    print("\n==================================================")
    print("🎉 ALL PHASE 4 BACKEND TESTS PASSED 100%!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(verify_phase_4())
