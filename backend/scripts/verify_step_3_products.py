import asyncio
import uuid
import httpx
from app.main import app
from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token
from app.models.user import User
from app.models.billing import Billings
from app.models.domain import Domain
from app.models.chatbot import ChatBot
from app.models.enums import Plans
from sqlalchemy import select, delete


async def test_products():
    print("--- Testing Phase 3 Step 6: Domain Products Management ---")
    async with AsyncSessionLocal() as session:
        # 1. Setup test user
        test_email = "test_product_owner@example.com"
        stmt = select(User).where(User.email == test_email)
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            user = User(
                id=uuid.uuid4(),
                fullname="Product Test User",
                email=test_email,
                hashed_password="fakehashfortest",
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

            # Billing
            billing = Billings(
                id=uuid.uuid4(),
                user_id=user.id,
                plan=Plans.STANDARD,
                credits=100,
            )
            session.add(billing)
            await session.commit()

        # 2. Setup domain
        stmt = select(Domain).where(Domain.user_id == user.id, Domain.name == "gadget-store.vn")
        res = await session.execute(stmt)
        domain = res.scalar_one_or_none()
        if not domain:
            domain = Domain(
                id=uuid.uuid4(),
                name="gadget-store.vn",
                icon="https://example.com/gadget.png",
                user_id=user.id,
            )
            session.add(domain)
            await session.flush()
            bot = ChatBot(id=uuid.uuid4(), domain_id=domain.id)
            session.add(bot)
            await session.commit()
            await session.refresh(domain)

        domain_id = str(domain.id)
        user_id = str(user.id)
        print(f"  [x] Setup test user and domain gadget-store.vn (ID: {domain_id})")

    token = create_access_token(subject=user_id)
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Step A: GET /products (initial)
        res = await client.get(f"/api/v1/domains/{domain_id}/products", headers=headers)
        assert res.status_code == 200, f"GET products failed: {res.text}"
        initial_products = res.json()
        print(f"  [x] GET /products initially returned {len(initial_products)} items OK")

        # Step B: POST /products
        payload = {
            "name": "Tai Nghe Chống Ồn Wireless X1",
            "price": 1490000,
            "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
        }
        res = await client.post(f"/api/v1/domains/{domain_id}/products", json=payload, headers=headers)
        assert res.status_code == 201, f"POST product failed: {res.text}"
        product_data = res.json()
        product_id = product_data["id"]
        assert product_data["name"] == payload["name"]
        assert product_data["price"] == 1490000
        print(f"  [x] POST /products 201 Created OK: ID={product_id}")

        # Step C: GET /products/{product_id}
        res = await client.get(f"/api/v1/domains/{domain_id}/products/{product_id}", headers=headers)
        assert res.status_code == 200, f"GET product detail failed: {res.text}"
        assert res.json()["id"] == product_id
        print("  [x] GET /products/{product_id} returned correct detail OK")

        # Step D: PUT /products/{product_id}
        update_payload = {
            "name": "Tai Nghe Chống Ồn Wireless X1 Pro",
            "price": 1690000,
        }
        res = await client.put(f"/api/v1/domains/{domain_id}/products/{product_id}", json=update_payload, headers=headers)
        assert res.status_code == 200, f"PUT product failed: {res.text}"
        assert res.json()["name"] == "Tai Nghe Chống Ồn Wireless X1 Pro"
        assert res.json()["price"] == 1690000
        print("  [x] PUT /products/{product_id} updated OK")

        # Step E: GET /products list
        res = await client.get(f"/api/v1/domains/{domain_id}/products", headers=headers)
        assert res.status_code == 200
        assert any(p["id"] == product_id for p in res.json())
        print("  [x] GET /products list includes updated product OK")

        # Step E.2: GET /products with search filter
        res_search_hit = await client.get(f"/api/v1/domains/{domain_id}/products?search=wireless", headers=headers)
        assert res_search_hit.status_code == 200
        assert any(p["id"] == product_id for p in res_search_hit.json())
        res_search_miss = await client.get(f"/api/v1/domains/{domain_id}/products?search=NonExistent123456", headers=headers)
        assert res_search_miss.status_code == 200
        assert len(res_search_miss.json()) == 0
        print("  [x] GET /products?search=... filtering works as expected OK")

        # Step F: DELETE /products/{product_id}
        res = await client.delete(f"/api/v1/domains/{domain_id}/products/{product_id}", headers=headers)
        assert res.status_code == 200, f"DELETE product failed: {res.text}"
        print("  [x] DELETE /products/{product_id} OK")

        # Step G: Verify deleted
        res = await client.get(f"/api/v1/domains/{domain_id}/products/{product_id}", headers=headers)
        assert res.status_code == 404, f"Product should be deleted: {res.text}"
        print("  [x] Verified 404 on deleted product OK")

    # Cleanup test domain
    async with AsyncSessionLocal() as session:
        await session.execute(delete(Domain).where(Domain.id == uuid.UUID(domain_id)))
        await session.execute(delete(Billings).where(Billings.user_id == uuid.UUID(user_id)))
        await session.execute(delete(User).where(User.id == uuid.UUID(user_id)))
        await session.commit()
        print("  [x] Test cleanup complete")

    print("\nALL PHASE 3 PRODUCTS TESTS PASSED! 🚀")


if __name__ == "__main__":
    asyncio.run(test_products())
