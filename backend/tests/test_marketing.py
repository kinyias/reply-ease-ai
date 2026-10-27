import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token
from app.main import app
from app.models.billing import Billings
from app.models.customer import Customer
from app.models.customer_response import CustomerResponses
from app.models.domain import Domain
from app.models.enums import Plans
from app.models.user import User


@pytest.mark.asyncio
async def test_email_marketing_campaign_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Setup user & initial billing in database
        user_id = uuid.uuid4()
        user_email = f"market_test_{uuid.uuid4().hex[:6]}@example.com"
        domain_id = uuid.uuid4()

        async with AsyncSessionLocal() as session:
            test_user = User(
                id=user_id,
                fullname="Tran Marketing Owner",
                email=user_email,
                hashed_password="fake_hashed_pw",
                type="owner",
            )
            initial_billing = Billings(
                id=uuid.uuid4(),
                user_id=user_id,
                plan=Plans.STANDARD,
                credits=10,
            )
            test_domain = Domain(
                id=domain_id,
                name="marketing-demo.com",
                icon="https://example.com/icon.png",
                user_id=user_id,
            )

            # Create 2 customer leads with filter questions
            cust1_id = uuid.uuid4()
            cust1 = Customer(
                id=cust1_id,
                email="lead1@example.com",
                domain_id=domain_id,
            )
            q1 = CustomerResponses(
                id=uuid.uuid4(),
                question="Nhu cầu sử dụng của bạn là gì?",
                answered="Tự động hóa bán hàng đa kênh",
                customer_id=cust1_id,
            )

            cust2_id = uuid.uuid4()
            cust2 = Customer(
                id=cust2_id,
                email="lead2@example.com",
                domain_id=domain_id,
            )
            q2 = CustomerResponses(
                id=uuid.uuid4(),
                question="Ngân sách dự kiến hàng tháng?",
                answered="Dưới 1 triệu VNĐ",
                customer_id=cust2_id,
            )

            session.add_all([test_user, initial_billing, test_domain, cust1, q1, cust2, q2])
            await session.commit()

        # Generate auth token
        token = create_access_token(user_id)
        auth_headers = {"Authorization": f"Bearer {token}"}

        # 2. Test GET /customers: Lead Inspection
        leads_res = await ac.get("/api/v1/marketing/customers", headers=auth_headers)
        assert leads_res.status_code == 200, leads_res.text
        leads_data = leads_res.json()
        assert leads_data["total"] >= 2
        emails = [l["email"] for l in leads_data["customers"]]
        assert "lead1@example.com" in emails
        assert "lead2@example.com" in emails

        # Inspect responses of lead1
        lead1 = next(l for l in leads_data["customers"] if l["email"] == "lead1@example.com")
        assert len(lead1["responses"]) == 1
        assert lead1["responses"][0]["answered"] == "Tự động hóa bán hàng đa kênh"

        # 3. Test POST /campaigns: Create campaign
        create_res = await ac.post(
            "/api/v1/marketing/campaigns",
            json={
                "name": "Chiến dịch Ra mắt Sản phẩm 2026",
                "template": "Xin chào {{email}}, cảm ơn bạn đã quan tâm đến dịch vụ!",
                "customers": ["lead1@example.com"],
            },
            headers=auth_headers,
        )
        assert create_res.status_code == 201, create_res.text
        campaign = create_res.json()
        campaign_id = campaign["id"]
        assert campaign["name"] == "Chiến dịch Ra mắt Sản phẩm 2026"
        assert campaign["recipients_count"] == 1

        # 4. Test GET /campaigns: List campaigns
        list_res = await ac.get("/api/v1/marketing/campaigns", headers=auth_headers)
        assert list_res.status_code == 200
        assert list_res.json()["total"] >= 1

        # 5. Test PUT /campaigns/{id}/template: Update template
        update_tmpl_res = await ac.put(
            f"/api/v1/marketing/campaigns/{campaign_id}/template",
            json={"template": "Kính gửi {{email}},\nNội dung ưu đãi mới nhất!"},
            headers=auth_headers,
        )
        assert update_tmpl_res.status_code == 200
        assert "Nội dung ưu đãi mới nhất" in update_tmpl_res.json()["template"]

        # 6. Test PUT /campaigns/{id}/customers: Assign customer leads
        assign_res = await ac.put(
            f"/api/v1/marketing/campaigns/{campaign_id}/customers",
            json={"customers": ["lead1@example.com", "lead2@example.com"]},
            headers=auth_headers,
        )
        assert assign_res.status_code == 200
        assert assign_res.json()["recipients_count"] == 2

        # 7. Test POST /campaigns/{id}/send: Send campaign to 2 emails
        send_res = await ac.post(
            f"/api/v1/marketing/campaigns/{campaign_id}/send",
            json={"emails": ["lead1@example.com", "lead2@example.com"]},
            headers=auth_headers,
        )
        assert send_res.status_code == 200, send_res.text
        send_data = send_res.json()
        assert send_data["total_recipients"] == 2
        assert send_data["credits_deducted"] == 2
        assert send_data["remaining_credits"] == 8

        # Verify DB credits decremented
        async with AsyncSessionLocal() as session:
            stmt = select(Billings).where(Billings.user_id == user_id)
            res = await session.execute(stmt)
            updated_billing = res.scalar_one()
            assert updated_billing.credits == 8

        # 8. Test Credit Exhaustion Prevention: Attempt to send 15 emails when only 8 credits left
        excess_emails = [f"test_lead_{i}@example.com" for i in range(15)]
        fail_send_res = await ac.post(
            f"/api/v1/marketing/campaigns/{campaign_id}/send",
            json={"emails": excess_emails},
            headers=auth_headers,
        )
        assert fail_send_res.status_code == 400
        assert "Không đủ credits" in fail_send_res.json()["detail"]
