import asyncio
import sys
import uuid
import httpx
from httpx import ASGITransport

from app.main import app
from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token, get_password_hash
from app.models.billing import Billings
from app.models.enums import Plans
from app.models.user import User


async def test_domain_endpoints():
    print("\n--- Testing Phase 3 Step 2: Domain CRUD & ChatBot Endpoints ---")

    test_email = f"crud_test_{uuid.uuid4().hex[:8]}@example.com"
    user_id = uuid.uuid4()

    # Create test user and standard billing
    async with AsyncSessionLocal() as db:
        user = User(
            id=user_id,
            fullname="Domain CRUD Tester",
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
        await db.commit()
        print(f"  [x] Setup test user: {test_email} (ID: {user_id})")

    token = create_access_token(subject=str(user_id))
    auth_headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test 401 Unauthorized
        res_unauth = await client.get("/api/v1/domains")
        assert res_unauth.status_code == 401, f"Expected 401, got {res_unauth.status_code}"
        print("  [x] 401 Unauthorized for missing token OK")

        # 2. Test GET /api/v1/domains (Initially empty)
        res_list_empty = await client.get("/api/v1/domains", headers=auth_headers)
        assert res_list_empty.status_code == 200, f"Expected 200, got {res_list_empty.status_code}"
        assert res_list_empty.json() == []
        print("  [x] GET /api/v1/domains initially empty OK")

        # 3. Test GET /api/v1/domains/quota
        res_quota = await client.get("/api/v1/domains/quota", headers=auth_headers)
        assert res_quota.status_code == 200
        quota_data = res_quota.json()
        assert quota_data["plan"] == "STANDARD"
        assert quota_data["max_domains"] == 1
        assert quota_data["used_domains"] == 0
        assert quota_data["remaining_domains"] == 1
        assert quota_data["can_create_domain"] is True
        print(f"  [x] GET /api/v1/domains/quota OK: {quota_data['used_domains']}/{quota_data['max_domains']} used")

        # 4. Test POST /api/v1/domains (Create domain)
        create_payload = {
            "name": "https://MY-SHOP.COM/store",
            "icon": "https://cdn.example.com/shop-icon.png",
        }
        res_create = await client.post("/api/v1/domains", json=create_payload, headers=auth_headers)
        assert res_create.status_code == 201, f"Expected 201, got {res_create.status_code}: {res_create.text}"
        domain_data = res_create.json()
        domain_id = domain_data["id"]
        assert domain_data["name"] == "my-shop.com"
        assert domain_data["icon"] == "https://cdn.example.com/shop-icon.png"
        assert domain_data["chat_bot"] is not None
        assert domain_data["chat_bot"]["welcome_message"] == "Hey there, have a question? Text us here"
        print(f"  [x] POST /api/v1/domains 201 Created OK: ID={domain_id}, Name={domain_data['name']}")

        # 5. Test GET /api/v1/domains/{domain_id}
        res_get = await client.get(f"/api/v1/domains/{domain_id}", headers=auth_headers)
        assert res_get.status_code == 200
        assert res_get.json()["id"] == domain_id
        assert res_get.json()["name"] == "my-shop.com"
        print(f"  [x] GET /api/v1/domains/{domain_id} OK")

        # 6. Test PUT /api/v1/domains/{domain_id} (Update domain)
        update_payload = {
            "name": "brand-store.vn",
            "icon": "https://cdn.example.com/brand-new-icon.png",
        }
        res_update = await client.put(f"/api/v1/domains/{domain_id}", json=update_payload, headers=auth_headers)
        assert res_update.status_code == 200
        updated_data = res_update.json()
        assert updated_data["name"] == "brand-store.vn"
        assert updated_data["icon"] == "https://cdn.example.com/brand-new-icon.png"
        print(f"  [x] PUT /api/v1/domains/{domain_id} updated name to {updated_data['name']} OK")

        # 7. Test GET /api/v1/domains/{domain_id}/chatbot
        res_bot = await client.get(f"/api/v1/domains/{domain_id}/chatbot", headers=auth_headers)
        assert res_bot.status_code == 200
        bot_data = res_bot.json()
        assert bot_data["welcome_message"] == "Hey there, have a question? Text us here"
        print("  [x] GET /api/v1/domains/{domain_id}/chatbot OK")

        # 8. Test PUT /api/v1/domains/{domain_id}/chatbot (Customizer)
        bot_update_payload = {
            "welcome_message": "Xin chào! Bạn cần hỗ trợ gì?",
            "icon": "https://cdn.example.com/bot-avatar.png",
            "background": "#ff7a00",
            "text_color": "#ffffff",
            "helpdesk": True,
        }
        res_bot_update = await client.put(
            f"/api/v1/domains/{domain_id}/chatbot",
            json=bot_update_payload,
            headers=auth_headers,
        )
        assert res_bot_update.status_code == 200
        updated_bot = res_bot_update.json()
        assert updated_bot["welcome_message"] == "Xin chào! Bạn cần hỗ trợ gì?"
        assert updated_bot["background"] == "#ff7a00"
        assert updated_bot["text_color"] == "#ffffff"
        assert updated_bot["helpdesk"] is True
        print(f"  [x] PUT /api/v1/domains/{domain_id}/chatbot customized successfully OK")

        # 9. Test DELETE /api/v1/domains/{domain_id}
        res_delete = await client.delete(f"/api/v1/domains/{domain_id}", headers=auth_headers)
        assert res_delete.status_code == 200
        print(f"  [x] DELETE /api/v1/domains/{domain_id} OK: {res_delete.json()['message']}")

        # 10. Verify 404 after delete
        res_after_delete = await client.get(f"/api/v1/domains/{domain_id}", headers=auth_headers)
        assert res_after_delete.status_code == 404
        print("  [x] 404 verification after domain deletion OK")

    # Cleanup user
    async with AsyncSessionLocal() as db:
        user_del = await db.get(User, user_id)
        if user_del:
            await db.delete(user_del)
            await db.commit()
        print("  [x] Test cleanup complete")

    print("\nALL PHASE 3 STEP 2 TESTS PASSED! 🚀")


if __name__ == "__main__":
    asyncio.run(test_domain_endpoints())
