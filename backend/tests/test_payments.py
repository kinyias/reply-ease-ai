import base64
import hashlib
import hmac
import json
import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token
from app.core.sepay_service import sepay_service
from app.main import app
from app.models.billing import Billings
from app.models.enums import PaymentStatus, PaymentType, Plans
from app.models.payment_transaction import PaymentTransaction
from app.models.user import User


@pytest.mark.asyncio
async def test_sepay_payments_and_webhook_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Setup user & initial billing in database
        user_id = uuid.uuid4()
        user_email = f"paytest_{uuid.uuid4().hex[:6]}@example.com"
        async with AsyncSessionLocal() as session:
            test_user = User(
                id=user_id,
                fullname="Nguyen Van A",
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
            session.add_all([test_user, initial_billing])
            await session.commit()

        # Generate auth token
        token = create_access_token(user_id)
        auth_headers = {"Authorization": f"Bearer {token}"}

        # 2. Test create payment for PRO subscription
        create_res = await ac.post(
            "/api/v1/payments/sepay/create-payment",
            json={
                "payment_type": "SUBSCRIPTION",
                "plan": "PRO",
            },
            headers=auth_headers,
        )
        assert create_res.status_code == 200, create_res.text
        data = create_res.json()
        assert data["amount"] == 350000
        assert data["payment_type"] == "SUBSCRIPTION"
        assert data["plan"] == "PRO"
        assert "SUB_PRO_" in data["order_code"]
        assert "qr.sepay.vn" in data["qr_url"]
        assert data["checkout_url"] == sepay_service.base_checkout_url
        assert "signature" in data["payment_fields"]
        order_code = data["order_code"]

        # 3. Test check status initially PENDING
        status_res = await ac.get(f"/api/v1/payments/check-status/{order_code}")
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["order_code"] == order_code
        assert status_data["status"] == "PENDING"
        assert status_data["amount"] == 350000

        # 4. Test SePay Webhook reconciliation
        webhook_payload = {
            "id": 9991234,
            "gateway": "MBBank",
            "transactionDate": "2026-10-26 15:30:00",
            "accountNumber": "0333888999",
            "content": f"{order_code} chuyen tien goi PRO",
            "transferAmount": 350000,
            "referenceCode": "MBFT2026102601",
        }
        raw_bytes = json.dumps(webhook_payload).encode("utf-8")
        webhook_sig = base64.b64encode(
            hmac.new(
                sepay_service.secret_key.encode("utf-8"),
                raw_bytes,
                hashlib.sha256,
            ).digest()
        ).decode("utf-8")

        webhook_res = await ac.post(
            "/api/v1/payments/sepay/webhook",
            content=raw_bytes,
            headers={
                "Content-Type": "application/json",
                "x-sepay-signature": webhook_sig,
            },
        )
        assert webhook_res.status_code == 200, webhook_res.text
        webhook_data = webhook_res.json()
        assert webhook_data["success"] is True

        # 5. Check status is now SUCCESS
        status_res2 = await ac.get(f"/api/v1/payments/check-status/{order_code}")
        assert status_res2.status_code == 200
        assert status_res2.json()["status"] == "SUCCESS"
        assert status_res2.json()["sepay_transaction_id"] == "MBFT2026102601"

        # 6. Verify User's billing was upgraded to PRO and +50 credits
        async with AsyncSessionLocal() as session:
            bill_stmt = select(Billings).where(Billings.user_id == user_id)
            bill_res = await session.execute(bill_stmt)
            updated_billing = bill_res.scalar_one()
            assert updated_billing.plan == Plans.PRO
            assert updated_billing.credits == 60  # 10 initial + 50 from PRO

        # 7. Test Idempotency (calling webhook again with same ref returns success without double-crediting)
        webhook_res2 = await ac.post(
            "/api/v1/payments/sepay/webhook",
            content=raw_bytes,
            headers={
                "Content-Type": "application/json",
                "x-sepay-signature": webhook_sig,
            },
        )
        assert webhook_res2.status_code == 200
        assert webhook_res2.json()["success"] is True

        async with AsyncSessionLocal() as session:
            bill_stmt = select(Billings).where(Billings.user_id == user_id)
            bill_res = await session.execute(bill_stmt)
            updated_billing2 = bill_res.scalar_one()
            assert updated_billing2.credits == 60  # Still 60, not double-credited

        # 8. Test Simulate Payment endpoint for ULTIMATE
        create_ult = await ac.post(
            "/api/v1/payments/sepay/create-payment",
            json={"payment_type": "SUBSCRIPTION", "plan": "ULTIMATE"},
            headers=auth_headers,
        )
        assert create_ult.status_code == 200
        ult_order_code = create_ult.json()["order_code"]
        assert "SUB_ULTIMATE_" in ult_order_code

        sim_res = await ac.post(
            "/api/v1/payments/sepay/simulate-payment",
            json={"order_code": ult_order_code},
        )
        assert sim_res.status_code == 200
        assert sim_res.json()["status"] == "SUCCESS"

        async with AsyncSessionLocal() as session:
            bill_stmt = select(Billings).where(Billings.user_id == user_id)
            bill_res = await session.execute(bill_stmt)
            ult_billing = bill_res.scalar_one()
            assert ult_billing.plan == Plans.ULTIMATE
            assert ult_billing.credits == 560  # 60 + 500

        # 9. Test Transactions List endpoint
        tx_res = await ac.get(
            "/api/v1/payments/transactions",
            headers=auth_headers,
        )
        assert tx_res.status_code == 200
        tx_data = tx_res.json()
        assert tx_data["total"] >= 2
        codes = [t["order_code"] for t in tx_data["transactions"]]
        assert order_code in codes
        assert ult_order_code in codes

        # 10. Test SePay Merchant Config endpoints
        conf_get = await ac.get(
            "/api/v1/payments/sepay/config",
            headers=auth_headers,
        )
        assert conf_get.status_code == 200
        assert "webhook_url" in conf_get.json()

        conf_put = await ac.put(
            "/api/v1/payments/sepay/config",
            json={
                "sepay_merchant_id": "MERCHANT_USER_123",
                "sepay_secret_key": "SECRET_USER_987654321",
                "bank_name": "Vietcombank",
                "bank_account": "999888777",
                "bank_holder": "NGUYEN VAN A",
            },
            headers=auth_headers,
        )
        assert conf_put.status_code == 200
        conf_updated = conf_put.json()
        assert conf_updated["is_configured"] is True
        assert conf_updated["sepay_merchant_id"] == "MERCHANT_USER_123"
        assert conf_updated["sepay_secret_key_masked"].endswith("4321")
