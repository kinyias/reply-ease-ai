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
                credits=100,
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
        assert data["checkout_url"] == sepay_service.checkout_init_url
        assert "signature" in data["payment_fields"]
        order_code = data["order_code"]

        # 3. Test check status initially PENDING
        status_res = await ac.get(f"/api/v1/payments/check-status/{order_code}")
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["order_code"] == order_code
        assert status_data["status"] == "PENDING"
        assert status_data["amount"] == 350000

        # 4. Test SePay Payment Gateway IPN (IPN.md specification)
        ipn_payload = {
            "timestamp": 1757058220,
            "notification_type": "ORDER_PAID",
            "order": {
                "id": "e2c195be-c721-47eb-b323-99ab24e52d85",
                "order_id": "NPSETVI00101000042R",
                "order_status": "CAPTURED",
                "order_currency": "VND",
                "order_amount": "350000.00",
                "order_invoice_number": order_code,
                "order_description": "Upgrade to PRO",
            },
            "transaction": {
                "id": "384c66dd-41e6-4316-a544-b4141682595c",
                "payment_method": "BANK_TRANSFER",
                "transaction_id": "SPTX_998877",
                "transaction_type": "PAYMENT",
                "transaction_status": "APPROVED",
                "transaction_amount": "350000",
                "transaction_currency": "VND",
            },
            "customer": {
                "customer_id": str(user_id),
            },
        }

        ipn_res = await ac.post(
            "/api/v1/payments/sepay/ipn",
            json=ipn_payload,
            headers={
                "X-Secret-Key": sepay_service.secret_key,
                "Content-Type": "application/json",
            },
        )
        assert ipn_res.status_code == 200, ipn_res.text
        assert ipn_res.json()["success"] is True

        # 5. Check status is now SUCCESS
        status_res2 = await ac.get(f"/api/v1/payments/check-status/{order_code}")
        assert status_res2.status_code == 200
        assert status_res2.json()["status"] == "SUCCESS"
        assert status_res2.json()["sepay_transaction_id"] == "SPTX_998877"

        # 6. Verify User's billing was upgraded to PRO and +500 credits
        async with AsyncSessionLocal() as session:
            bill_stmt = select(Billings).where(Billings.user_id == user_id)
            bill_res = await session.execute(bill_stmt)
            updated_billing = bill_res.scalar_one()
            assert updated_billing.plan == Plans.PRO
            assert updated_billing.credits == 600  # 100 initial + 500 from PRO

        # 7. Test Idempotency (calling IPN again with same invoice returns success without double-crediting)
        ipn_res2 = await ac.post(
            "/api/v1/payments/sepay/ipn",
            json=ipn_payload,
            headers={
                "X-Secret-Key": sepay_service.secret_key,
                "Content-Type": "application/json",
            },
        )
        assert ipn_res2.status_code == 200
        assert ipn_res2.json()["success"] is True

        async with AsyncSessionLocal() as session:
            bill_stmt = select(Billings).where(Billings.user_id == user_id)
            bill_res = await session.execute(bill_stmt)
            updated_billing2 = bill_res.scalar_one()
            assert updated_billing2.credits == 600  # Still 600, not double-credited

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
            assert ult_billing.credits == 5600  # 600 + 5000

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

        # 11. Test Cancel Order API (CANCLEORDER.md)
        create_to_cancel = await ac.post(
            "/api/v1/payments/sepay/create-payment",
            json={"payment_type": "SUBSCRIPTION", "plan": "PRO"},
            headers=auth_headers,
        )
        assert create_to_cancel.status_code == 200
        cancel_code = create_to_cancel.json()["order_code"]

        cancel_res = await ac.post(
            "/api/v1/payments/sepay/cancel-order",
            json={"order_invoice_number": cancel_code},
            headers=auth_headers,
        )
        assert cancel_res.status_code == 200
        assert cancel_res.json()["success"] is True
        assert cancel_res.json()["status"] == "CANCELLED"

