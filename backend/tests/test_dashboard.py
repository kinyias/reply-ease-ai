import uuid
from datetime import datetime, timezone
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token
from app.main import app
from app.models.billing import Billings
from app.models.booking import Bookings
from app.models.customer import Customer
from app.models.domain import Domain
from app.models.enums import PaymentStatus, PaymentType, Plans
from app.models.payment_transaction import PaymentTransaction
from app.models.product import Product
from app.models.user import User


@pytest.mark.asyncio
async def test_dashboard_metrics_and_reporting():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Setup user & related domain data
        user_id = uuid.uuid4()
        user_email = f"dash_test_{uuid.uuid4().hex[:6]}@example.com"
        domain_id = uuid.uuid4()

        async with AsyncSessionLocal() as session:
            test_user = User(
                id=user_id,
                fullname="Nguyen Dashboard Owner",
                email=user_email,
                hashed_password="fake_hashed_pw",
                type="owner",
            )
            billing = Billings(
                id=uuid.uuid4(),
                user_id=user_id,
                plan=Plans.PRO,
                credits=45,
            )
            test_domain = Domain(
                id=domain_id,
                name="dashboard-shop.com",
                icon="https://example.com/icon.png",
                user_id=user_id,
            )
            # Create products: 200,000 + 300,000 = 500,000 VND
            p1 = Product(
                id=uuid.uuid4(),
                name="Course AI",
                price=200000,
                image="https://example.com/p1.png",
                domain_id=domain_id,
            )
            p2 = Product(
                id=uuid.uuid4(),
                name="VIP Consulting",
                price=300000,
                image="https://example.com/p2.png",
                domain_id=domain_id,
            )
            # Create 2 customers
            cust1 = Customer(
                id=uuid.uuid4(),
                email="cust1@example.com",
                domain_id=domain_id,
            )
            cust2 = Customer(
                id=uuid.uuid4(),
                email="cust2@example.com",
                domain_id=domain_id,
            )
            # Create 1 booking
            now_dt = datetime.now(timezone.utc)
            booking = Bookings(
                id=uuid.uuid4(),
                date=now_dt,
                slot="09:00 - 10:00",
                email="cust1@example.com",
                customer_id=cust1.id,
                domain_id=domain_id,
            )
            # 1 successful subscription transaction (system upgrade - should NOT count towards total_sales)
            tx_sub = PaymentTransaction(
                id=uuid.uuid4(),
                order_code=f"TX_SUB_{uuid.uuid4().hex[:8].upper()}",
                amount=350000,
                payment_type=PaymentType.SUBSCRIPTION,
                status=PaymentStatus.SUCCESS,
                content="Upgrade PRO",
                user_id=user_id,
                domain_id=domain_id,
            )
            # 1 successful product checkout transaction (customer sale - SHOULD count towards total_sales)
            tx_sale = PaymentTransaction(
                id=uuid.uuid4(),
                order_code=f"TX_SALE_{uuid.uuid4().hex[:8].upper()}",
                amount=200000,
                payment_type=PaymentType.PRODUCT_CHECKOUT,
                status=PaymentStatus.SUCCESS,
                content="Course AI Order",
                user_id=user_id,
                domain_id=domain_id,
                customer_id=cust1.id,
            )

            session.add_all([test_user, billing, test_domain, p1, p2, cust1, cust2, booking, tx_sub, tx_sale])
            await session.commit()

        # 2. Authenticate
        token = create_access_token(user_id)
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Test GET /api/v1/dashboard/metrics
        metrics_resp = await ac.get("/api/v1/dashboard/metrics", headers=headers)
        assert metrics_resp.status_code == 200
        metrics_data = metrics_resp.json()
        assert metrics_data["potential_clients"] == 2
        # pipeline_value = (200000 + 300000) * 2 = 1,000,000 VND
        assert metrics_data["pipeline_value"] == 1000000
        assert metrics_data["appointments"] == 1
        # total_sales must only include customer sales (200000 VND), NOT subscription plan upgrade (350000 VND)
        assert metrics_data["total_sales"] == 200000

        # 4. Test GET /api/v1/dashboard/plan-usage
        usage_resp = await ac.get("/api/v1/dashboard/plan-usage", headers=headers)
        assert usage_resp.status_code == 200
        usage_data = usage_resp.json()
        assert usage_data["plan"] == "PRO"
        assert usage_data["credits"] == 45
        assert usage_data["domains_used"] == 1
        assert usage_data["max_domains"] == 5
        assert usage_data["clients_count"] == 2

        # 5. Test GET /api/v1/dashboard/transactions
        tx_resp = await ac.get("/api/v1/dashboard/transactions", headers=headers)
        assert tx_resp.status_code == 200
        tx_data = tx_resp.json()
        assert tx_data["total"] >= 1
        assert len(tx_data["transactions"]) >= 1
        first_tx = tx_data["transactions"][0]
        assert first_tx["amount"] == 350000
        assert first_tx["status"] == "SUCCESS"

        # 6. Test GET /api/v1/dashboard/appointments
        appt_resp = await ac.get("/api/v1/dashboard/appointments", headers=headers)
        assert appt_resp.status_code == 200
        appt_data = appt_resp.json()
        assert appt_data["total"] == 1
        assert appt_data["today_count"] == 1
        assert appt_data["appointments"][0]["slot"] == "09:00 - 10:00"
        assert appt_data["appointments"][0]["email"] == "cust1@example.com"
