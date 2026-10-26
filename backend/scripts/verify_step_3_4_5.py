import asyncio
import uuid
import httpx
from httpx import ASGITransport

from app.main import app
from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token, get_password_hash
from app.models.billing import Billings
from app.models.domain import Domain
from app.models.enums import Plans
from app.models.user import User


async def test_training_endpoints():
    print("\n--- Testing Phase 3 Step 4 & 5: HelpDesk FAQ and Filter Questions ---")

    user_id = uuid.uuid4()
    domain_id = uuid.uuid4()
    test_email = f"training_test_{uuid.uuid4().hex[:8]}@example.com"

    # Setup test user, billing and domain
    async with AsyncSessionLocal() as db:
        user = User(
            id=user_id,
            fullname="Training Tester",
            email=test_email,
            hashed_password=get_password_hash("password123"),
            type="owner",
        )
        db.add(user)

        billing = Billings(
            id=uuid.uuid4(),
            plan=Plans.STANDARD,
            credits=10,
            user_id=user.id,
        )
        db.add(billing)

        domain = Domain(
            id=domain_id,
            name="training-store.vn",
            icon="https://icon.test/icon.png",
            user_id=user.id,
        )
        db.add(domain)
        await db.commit()
        print(f"  [x] Setup test user and domain {domain.name} (ID: {domain_id})")

    token = create_access_token(subject=str(user_id))
    auth_headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # ==========================================
        # Part 1: HelpDesk FAQ Tests (Step 4)
        # ==========================================
        print("\n  [Testing Step 4: HelpDesk FAQ]")

        # 1. GET initially empty
        res_faq_empty = await client.get(f"/api/v1/domains/{domain_id}/helpdesk", headers=auth_headers)
        assert res_faq_empty.status_code == 200
        assert res_faq_empty.json() == []
        print("  [x] GET /helpdesk initially empty OK")

        # 2. POST create FAQ
        faq_payload = {
            "question": "Chính sách đổi trả sản phẩm thế nào?",
            "answer": "Chúng tôi hỗ trợ 1 đổi 1 miễn phí trong 7 ngày nếu có lỗi từ nhà sản xuất.",
        }
        res_create_faq = await client.post(
            f"/api/v1/domains/{domain_id}/helpdesk",
            json=faq_payload,
            headers=auth_headers,
        )
        assert res_create_faq.status_code == 201, f"Expected 201, got {res_create_faq.status_code}: {res_create_faq.text}"
        faq_data = res_create_faq.json()
        faq_id = faq_data["id"]
        assert faq_data["question"] == faq_payload["question"]
        assert faq_data["answer"] == faq_payload["answer"]
        print(f"  [x] POST /helpdesk 201 Created OK: ID={faq_id}")

        # 3. PUT update FAQ
        faq_update = {
            "question": "Chính sách đổi trả sản phẩm mới?",
            "answer": "Hỗ trợ đổi trả trong 14 ngày trên toàn quốc.",
        }
        res_up_faq = await client.put(
            f"/api/v1/domains/{domain_id}/helpdesk/{faq_id}",
            json=faq_update,
            headers=auth_headers,
        )
        assert res_up_faq.status_code == 200
        assert res_up_faq.json()["question"] == faq_update["question"]
        assert res_up_faq.json()["answer"] == faq_update["answer"]
        print(f"  [x] PUT /helpdesk/{faq_id} updated OK")

        # 4. GET list with updated FAQ
        res_list_faq = await client.get(f"/api/v1/domains/{domain_id}/helpdesk", headers=auth_headers)
        assert res_list_faq.status_code == 200
        assert len(res_list_faq.json()) == 1
        print("  [x] GET /helpdesk returned 1 FAQ item OK")

        # 5. DELETE FAQ
        res_del_faq = await client.delete(f"/api/v1/domains/{domain_id}/helpdesk/{faq_id}", headers=auth_headers)
        assert res_del_faq.status_code == 200
        print("  [x] DELETE /helpdesk/{faq_id} OK")

        # 6. Verify empty after delete
        res_faq_after = await client.get(f"/api/v1/domains/{domain_id}/helpdesk", headers=auth_headers)
        assert res_faq_after.json() == []
        print("  [x] Verified 0 FAQs after deletion OK")

        # ==========================================
        # Part 2: Filter Questions Tests (Step 5)
        # ==========================================
        print("\n  [Testing Step 5: Filter Questions]")

        # 1. GET initially empty
        res_q_empty = await client.get(f"/api/v1/domains/{domain_id}/filter-questions", headers=auth_headers)
        assert res_q_empty.status_code == 200
        assert res_q_empty.json() == []
        print("  [x] GET /filter-questions initially empty OK")

        # 2. POST create Filter Question
        q_payload = {
            "question": "Bạn đang quan tâm đến sản phẩm hoặc dịch vụ nào?",
        }
        res_create_q = await client.post(
            f"/api/v1/domains/{domain_id}/filter-questions",
            json=q_payload,
            headers=auth_headers,
        )
        assert res_create_q.status_code == 201, f"Expected 201, got {res_create_q.status_code}: {res_create_q.text}"
        q_data = res_create_q.json()
        q_id = q_data["id"]
        assert q_data["question"] == q_payload["question"]
        print(f"  [x] POST /filter-questions 201 Created OK: ID={q_id}")

        # 3. PUT update Filter Question
        q_update = {
            "question": "Ngân sách dự kiến của bạn là bao nhiêu?",
        }
        res_up_q = await client.put(
            f"/api/v1/domains/{domain_id}/filter-questions/{q_id}",
            json=q_update,
            headers=auth_headers,
        )
        assert res_up_q.status_code == 200
        assert res_up_q.json()["question"] == q_update["question"]
        print(f"  [x] PUT /filter-questions/{q_id} updated OK")

        # 4. GET list with updated question
        res_list_q = await client.get(f"/api/v1/domains/{domain_id}/filter-questions", headers=auth_headers)
        assert res_list_q.status_code == 200
        assert len(res_list_q.json()) == 1
        print("  [x] GET /filter-questions returned 1 question OK")

        # 5. DELETE Filter Question
        res_del_q = await client.delete(f"/api/v1/domains/{domain_id}/filter-questions/{q_id}", headers=auth_headers)
        assert res_del_q.status_code == 200
        print("  [x] DELETE /filter-questions/{q_id} OK")

        # 6. Verify empty after delete
        res_q_after = await client.get(f"/api/v1/domains/{domain_id}/filter-questions", headers=auth_headers)
        assert res_q_after.json() == []
        print("  [x] Verified 0 filter questions after deletion OK")

    # Cleanup test entities
    async with AsyncSessionLocal() as db:
        user_del = await db.get(User, user_id)
        if user_del:
            await db.delete(user_del)
            await db.commit()
        print("  [x] Test cleanup complete")

    print("\nALL PHASE 3 STEP 4 & 5 BACKEND TESTS PASSED! 🚀")


if __name__ == "__main__":
    asyncio.run(test_training_endpoints())
