import pytest
import pytest_asyncio
import uuid
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.domain import Domain
from app.models.customer import Customer
from app.models.customer_response import CustomerResponses
from app.models.product import Product
from app.models.booking import Bookings


@pytest.mark.asyncio
async def test_portal_full_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create test domain, user, customer in DB
        async with AsyncSessionLocal() as session:
            test_user = User(
                id=uuid.uuid4(),
                fullname="Test Owner",
                email=f"owner_{uuid.uuid4().hex[:8]}@example.com",
                hashed_password="hashed_pw_test",
                type="owner",
            )
            test_domain = Domain(
                id=uuid.uuid4(),
                name=f"domain-{uuid.uuid4().hex[:6]}.com",
                icon="https://example.com/icon.png",
                user_id=test_user.id,
            )
            test_customer = Customer(
                id=uuid.uuid4(),
                email="customer@example.com",
                domain_id=test_domain.id,
            )
            q1 = CustomerResponses(
                id=uuid.uuid4(),
                question="What is your budget?",
                answered=None,
                customer_id=test_customer.id,
            )
            test_product = Product(
                id=uuid.uuid4(),
                name="AI Consultation Package",
                price=500000,
                image="https://example.com/product.jpg",
                domain_id=test_domain.id,
            )
            session.add_all([test_user, test_domain, test_customer, q1, test_product])
            await session.commit()

            domain_id = str(test_domain.id)
            customer_id = str(test_customer.id)
            q1_id = str(q1.id)

        try:
            # 1. Fetch appointment data
            res_appt = await ac.get(f"/api/v1/portal/{domain_id}/appointment/{customer_id}")
            assert res_appt.status_code == 200
            data_appt = res_appt.json()
            assert data_appt["domain_name"] == test_domain.name
            assert len(data_appt["questions"]) == 1
            assert data_appt["questions"][0]["question"] == "What is your budget?"

            # 2. Book appointment
            booking_date = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
            res_book = await ac.post(
                f"/api/v1/portal/{domain_id}/appointment/{customer_id}",
                json={
                    "date": booking_date,
                    "slot": "10:00 AM",
                    "email": "customer@example.com",
                    "answers": [{"id": q1_id, "answered": "$500 - $1000"}],
                },
            )
            assert res_book.status_code == 200
            book_data = res_book.json()
            assert book_data["slot"] == "10:00 AM"

            # 3. Collision check: Try booking same slot on same day -> must return 400
            res_collide = await ac.post(
                f"/api/v1/portal/{domain_id}/appointment/{customer_id}",
                json={
                    "date": booking_date,
                    "slot": "10:00 AM",
                    "email": "another@example.com",
                },
            )
            assert res_collide.status_code == 400

            # 4. Fetch payment portal data
            res_pay = await ac.get(f"/api/v1/portal/{domain_id}/payment/{customer_id}")
            assert res_pay.status_code == 200
            pay_data = res_pay.json()
            assert len(pay_data["products"]) == 1
            assert pay_data["total_amount"] == 500000

            # 5. Create order
            res_order = await ac.post(
                f"/api/v1/portal/{domain_id}/payment/{customer_id}/create-order",
                json={"payment_method": "vietqr"},
            )
            assert res_order.status_code == 200
            order_data = res_order.json()
            assert order_data["amount"] == 500000
            assert order_data["status"] == "PENDING"
            order_code = order_data["order_code"]

            # 6. Check order status
            res_status = await ac.get(f"/api/v1/portal/payment/status/{order_code}")
            assert res_status.status_code == 200
            assert res_status.json()["status"] == "PENDING"

            # 7. Simulate payment confirmation
            res_sim = await ac.post(
                "/api/v1/portal/payment/simulate-confirm",
                json={"order_code": order_code},
            )
            assert res_sim.status_code == 200
            assert res_sim.json()["status"] == "SUCCESS"

            # 8. Check updated status
            res_status2 = await ac.get(f"/api/v1/portal/payment/status/{order_code}")
            assert res_status2.json()["status"] == "SUCCESS"

        finally:
            # Clean up test domain and records cascade
            async with AsyncSessionLocal() as session:
                d = await session.get(Domain, test_domain.id)
                if d:
                    await session.delete(d)
                u = await session.get(User, test_user.id)
                if u:
                    await session.delete(u)
                await session.commit()
