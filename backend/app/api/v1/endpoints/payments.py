import logging
import re
import secrets
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.sepay_service import sepay_service
from app.models.billing import Billings
from app.models.domain import Domain
from app.models.enums import PaymentStatus, PaymentType, Plans
from app.models.payment_transaction import PaymentTransaction
from app.models.product import Product
from app.models.user import User
from app.schemas.payment import (
    CancelOrderRequest,
    CancelOrderResponse,
    CreatePaymentRequest,
    PaymentResponse,
    PaymentStatusResponse,
    PaymentTransactionItem,
    SepayMerchantConfigRequest,
    SepayMerchantConfigResponse,
    SepayWebhookPayload,
    SimulatePaymentRequest,
    TransactionListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

PLAN_PRICING = {
    Plans.STANDARD: 0,
    Plans.PRO: 350000,       # 350,000 VND / month
    Plans.ULTIMATE: 850000,  # 850,000 VND / month
}

PLAN_CREDITS = {
    Plans.STANDARD: 100,
    Plans.PRO: 500,
    Plans.ULTIMATE: 5000,
}


# =========================================================================
# Step 7.2: Create Payment & Check Status
# =========================================================================

@router.post(
    "/sepay/create-payment",
    response_model=PaymentResponse,
    summary="Create SePay Payment Transaction (Subscription Upgrade or Product Checkout)",
    description="Generates a unique order code, persists transaction, and produces VietQR & SePay Gateway parameters.",
)
async def create_sepay_payment(
    payload: CreatePaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Determine Amount & Validation
    amount = 0
    plan_to_upgrade: Optional[Plans] = None

    if payload.payment_type == PaymentType.SUBSCRIPTION:
        if not payload.plan or payload.plan == Plans.STANDARD:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A valid paid plan (PRO or ULTIMATE) is required for subscription upgrades.",
            )
        plan_to_upgrade = payload.plan
        amount = payload.amount or PLAN_PRICING.get(plan_to_upgrade, 350000)
        description = payload.description or f"ReplyEase AI - Upgrade to {plan_to_upgrade.value} Plan"
    elif payload.payment_type == PaymentType.PRODUCT_CHECKOUT:
        if payload.amount:
            amount = payload.amount
        elif payload.product_ids:
            # Calculate sum of selected products
            prod_stmt = select(Product).where(Product.id.in_(payload.product_ids))
            res = await db.execute(prod_stmt)
            products = res.scalars().all()
            amount = sum(p.price for p in products)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount or product_ids must be specified for product checkout.",
            )
        description = payload.description or f"ReplyEase AI - Order Payment"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported payment_type '{payload.payment_type}'.",
        )

    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order amount must be greater than 0 VND.",
        )

    # 2. Generate unique memorable order code for VietQR & SePay invoice
    # Short alphanumeric format: RE + 6 hex chars (e.g. RE89A1B2)
    rand_suffix = secrets.token_hex(3).upper()
    if plan_to_upgrade:
        order_code = f"SUB_{plan_to_upgrade.value}_{rand_suffix}"
    else:
        order_code = f"RE{rand_suffix}"

    # 3. Store Payment Transaction
    transaction = PaymentTransaction(
        id=uuid.uuid4(),
        order_code=order_code,
        amount=amount,
        payment_type=payload.payment_type,
        status=PaymentStatus.PENDING,
        content=order_code,
        user_id=current_user.id,
        domain_id=payload.domain_id,
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)

    # 4. Bank details for VietQR
    bank_code = sepay_service.default_bank_code
    bank_account = sepay_service.default_bank_account
    account_name = sepay_service.default_bank_holder

    qr_url = sepay_service.generate_vietqr_url(
        bank_account=bank_account,
        bank_code=bank_code,
        amount=amount,
        content=order_code,
    )

    # 5. Build SePay Gateway checkout fields (strictly adhering to PAYMENT.md)
    checkout_payload = sepay_service.build_checkout_payload(
        order_invoice_number=order_code,
        order_amount=amount,
        order_description=description,
        customer_id=str(current_user.id),
        success_url=f"{settings.FRONTEND_URL}/billing?order_code={order_code}&status=success",
        error_url=f"{settings.FRONTEND_URL}/billing?order_code={order_code}&status=error",
        cancel_url=f"{settings.FRONTEND_URL}/billing?order_code={order_code}&status=cancel",
    )

    # 6. Try resolving direct checkout redirect link (302 Location from SePay checkout/init)
    direct_checkout_url = await sepay_service.resolve_checkout_redirect(
        checkout_payload["payment_fields"],
        init_url=checkout_payload["checkout_url"],
    )

    return PaymentResponse(
        order_code=order_code,
        amount=amount,
        payment_type=payload.payment_type,
        qr_url=qr_url,
        bank_name=bank_code,
        bank_account=bank_account,
        account_name=account_name,
        content=order_code,
        checkout_url=checkout_payload["checkout_url"],
        direct_checkout_url=direct_checkout_url,
        payment_fields=checkout_payload["payment_fields"],
        plan=plan_to_upgrade,
        created_at=transaction.created_at,
    )


@router.get(
    "/check-status/{order_code}",
    response_model=PaymentStatusResponse,
    summary="Check Transaction Status (Realtime Polling)",
    description="Polling endpoint to check if payment transaction has completed via VietQR / SePay Webhook.",
)
async def check_payment_status(
    order_code: str,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PaymentTransaction).where(
        PaymentTransaction.order_code == order_code.strip()
    )
    res = await db.execute(stmt)
    transaction = res.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_code}' was not found.",
        )

    # Parse plan if subscription
    plan: Optional[Plans] = None
    if "ULTIMATE" in transaction.order_code:
        plan = Plans.ULTIMATE
    elif "PRO" in transaction.order_code:
        plan = Plans.PRO

    return PaymentStatusResponse(
        order_code=transaction.order_code,
        status=transaction.status,
        amount=transaction.amount,
        payment_type=transaction.payment_type,
        sepay_transaction_id=transaction.sepay_transaction_id,
        content=transaction.content,
        plan=plan,
        created_at=transaction.created_at,
        updated_at=transaction.updated_at,
    )


@router.get(
    "/transactions",
    response_model=TransactionListResponse,
    summary="Get User Transaction History",
    description="List all past and pending payment transactions for current user.",
)
async def get_user_transactions(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Total count
    count_stmt = (
        select(func.count(PaymentTransaction.id))
        .where(PaymentTransaction.user_id == current_user.id)
    )
    count_res = await db.execute(count_stmt)
    total = count_res.scalar_one() or 0

    # Records
    stmt = (
        select(PaymentTransaction)
        .where(PaymentTransaction.user_id == current_user.id)
        .order_by(desc(PaymentTransaction.created_at))
        .offset(offset)
        .limit(limit)
    )
    res = await db.execute(stmt)
    transactions = res.scalars().all()

    items = [
        PaymentTransactionItem(
            id=t.id,
            order_code=t.order_code,
            amount=t.amount,
            payment_type=t.payment_type,
            status=t.status,
            content=t.content,
            sepay_transaction_id=t.sepay_transaction_id,
            created_at=t.created_at,
        )
        for t in transactions
    ]

    return TransactionListResponse(
        transactions=items,
        total=total,
    )


# =========================================================================
# Step 7.3: SePay IPN & Webhook Handler (Auto Reconciliation - IPN.md)
# =========================================================================

@router.post(
    "/sepay/ipn",
    summary="SePay Payment Gateway IPN Receiver",
    description="Receives automatic real-time payment notifications (IPN.md) from SePay Payment Gateway.",
)
@router.post(
    "/sepay/webhook",
    summary="SePay IPN / Webhook Receiver",
    description="Receives payment notifications and bank balance webhooks from SePay.",
)
@router.post(
    "/ipn",
    include_in_schema=False,
)
@router.post(
    "/webhook",
    include_in_schema=False,
)
async def sepay_ipn_webhook_handler(
    request: Request,
    response: Response,
    x_secret_key: Optional[str] = Header(None, alias="X-Secret-Key"),
    authorization: Optional[str] = Header(None),
    x_sepay_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    raw_body = await request.body()
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    logger.info("Received SePay IPN/Webhook: headers=(X-Secret-Key=%s, auth=%s), payload=%s",
                bool(x_secret_key), bool(authorization), payload)

    # 1. Verification:
    # A) Check X-Secret-Key (Official SePay Payment Gateway IPN auth)
    # B) Or Check Apikey / HMAC signature (Personal bank scraper webhook)
    # C) Permissive in development mode
    is_valid = False
    if x_secret_key:
        is_valid = sepay_service.verify_ipn_secret_key(x_secret_key)
    elif authorization or x_sepay_signature:
        is_valid = sepay_service.verify_webhook_signature(
            authorization_header=authorization,
            sepay_signature_header=x_sepay_signature,
            raw_body=raw_body,
        )
    elif settings.ENVIRONMENT == "development":
        logger.info("SePay Webhook received without auth in development mode: accepted")
        is_valid = True

    if not is_valid:
        logger.warning("SePay IPN/Webhook rejected: Unauthorized")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Webhook secret key or authorization credentials.",
        )

    # 2. Distinguish between SePay Payment Gateway IPN (IPN.md) and Bank Scraper Webhook
    notification_type = payload.get("notification_type")
    order_data = payload.get("order") if isinstance(payload.get("order"), dict) else None
    tx_data = payload.get("transaction") if isinstance(payload.get("transaction"), dict) else None

    if notification_type or order_data:
        # ------------------------------------------------------------------
        # Official SePay Payment Gateway IPN format
        # ------------------------------------------------------------------
        order_inv = (
            order_data.get("order_invoice_number")
            or order_data.get("order_id")
            or payload.get("order_invoice_number")
        )
        tx_id = (
            (tx_data.get("transaction_id") if tx_data else None)
            or (order_data.get("id") if order_data else None)
            or str(payload.get("timestamp") or "")
        )

        if not order_inv:
            logger.warning("No order_invoice_number in SePay IPN payload")
            return {"success": False, "message": "Missing order_invoice_number"}

        # Find transaction
        stmt = (
            select(PaymentTransaction)
            .options(selectinload(PaymentTransaction.user))
            .where(
                (PaymentTransaction.order_code == order_inv)
                | (PaymentTransaction.content == order_inv)
            )
        )
        res = await db.execute(stmt)
        transaction = res.scalar_one_or_none()

        if not transaction:
            logger.warning("PaymentTransaction not found for order invoice: %s", order_inv)
            return {"success": False, "message": f"Order {order_inv} not found"}

        if notification_type == "ORDER_PAID":
            if transaction.status == PaymentStatus.SUCCESS:
                logger.info("Order %s already marked SUCCESS (idempotent IPN)", order_inv)
                return {"success": True, "message": "Order already confirmed previously"}

            transaction.status = PaymentStatus.SUCCESS
            transaction.sepay_transaction_id = tx_id
            transaction.updated_at = datetime.now(timezone.utc)

            # Upgrade User Subscription if SUBSCRIPTION
            if transaction.payment_type == PaymentType.SUBSCRIPTION and transaction.user_id:
                bill_stmt = select(Billings).where(Billings.user_id == transaction.user_id)
                bill_res = await db.execute(bill_stmt)
                billing = bill_res.scalar_one_or_none()

                target_plan = Plans.PRO
                credits_to_add = PLAN_CREDITS[Plans.PRO]
                if "ULTIMATE" in transaction.order_code:
                    target_plan = Plans.ULTIMATE
                    credits_to_add = PLAN_CREDITS[Plans.ULTIMATE]

                if billing:
                    billing.plan = target_plan
                    billing.credits = max(billing.credits, 0) + credits_to_add
                else:
                    new_billing = Billings(
                        id=uuid.uuid4(),
                        user_id=transaction.user_id,
                        plan=target_plan,
                        credits=credits_to_add,
                    )
                    db.add(new_billing)

            await db.commit()
            logger.info("SePay IPN confirmed order %s successfully", order_inv)
            response.status_code = status.HTTP_200_OK
            return {
                "success": True,
                "message": "Order confirmed successfully",
                "order_code": transaction.order_code,
            }

        elif notification_type == "TRANSACTION_VOID":
            transaction.status = PaymentStatus.FAILED
            transaction.updated_at = datetime.now(timezone.utc)
            await db.commit()
            logger.info("SePay IPN voided order %s", order_inv)
            return {"success": True, "message": "Transaction voided"}

        return {"success": True, "message": f"Unhandled notification_type {notification_type}"}

    # ------------------------------------------------------------------
    # Fallback: Bank balance webhook format (content + transferAmount)
    # ------------------------------------------------------------------
    content = payload.get("content", "") or ""
    order_inv = payload.get("order_invoice_number") or payload.get("code")
    transfer_amount = payload.get("transferAmount") or payload.get("accumulated") or 0
    ref_code = str(payload.get("referenceCode") or payload.get("id") or "")

    extracted_code = order_inv or sepay_service.extract_order_code_from_content(content)

    if not extracted_code:
        logger.warning("Could not extract order_code from transfer content: '%s'", content)
        return {
            "success": False,
            "message": "Order code not recognized in transfer description",
        }

    stmt = (
        select(PaymentTransaction)
        .options(selectinload(PaymentTransaction.user))
        .where(
            (PaymentTransaction.order_code == extracted_code)
            | (PaymentTransaction.content == extracted_code)
        )
    )
    res = await db.execute(stmt)
    transaction = res.scalar_one_or_none()

    if not transaction:
        fuzzy_stmt = select(PaymentTransaction).where(
            func.position(PaymentTransaction.order_code, content) > 0
        )
        fuzzy_res = await db.execute(fuzzy_stmt)
        transaction = fuzzy_res.scalar_one_or_none()

    if not transaction:
        logger.warning("PaymentTransaction not found for order_code: %s", extracted_code)
        return {
            "success": False,
            "message": f"Transaction not found for order code: {extracted_code}",
        }

    if transaction.status == PaymentStatus.SUCCESS:
        logger.info("Order %s already processed with SUCCESS.", transaction.order_code)
        return {
            "success": True,
            "message": "Transaction was already completed previously.",
        }

    transaction.status = PaymentStatus.SUCCESS
    transaction.sepay_transaction_id = ref_code
    transaction.updated_at = datetime.now(timezone.utc)

    if transaction.payment_type == PaymentType.SUBSCRIPTION and transaction.user_id:
        bill_stmt = select(Billings).where(Billings.user_id == transaction.user_id)
        bill_res = await db.execute(bill_stmt)
        billing = bill_res.scalar_one_or_none()

        target_plan = Plans.PRO
        credits_to_add = PLAN_CREDITS[Plans.PRO]
        if "ULTIMATE" in transaction.order_code:
            target_plan = Plans.ULTIMATE
            credits_to_add = PLAN_CREDITS[Plans.ULTIMATE]

        if billing:
            billing.plan = target_plan
            billing.credits = max(billing.credits, 0) + credits_to_add
        else:
            new_billing = Billings(
                id=uuid.uuid4(),
                user_id=transaction.user_id,
                plan=target_plan,
                credits=credits_to_add,
            )
            db.add(new_billing)

    await db.commit()
    logger.info("SePay Webhook processed successfully for order: %s", transaction.order_code)

    response.status_code = status.HTTP_200_OK
    return {
        "success": True,
        "message": "Transaction processed successfully",
        "order_code": transaction.order_code,
    }


# =========================================================================
# Step 7.4: Cancel Order API (CANCLEORDER.md)
# =========================================================================

@router.post(
    "/sepay/cancel-order",
    response_model=CancelOrderResponse,
    summary="Cancel SePay Pending Order",
    description="Cancel an unpaid or pending order via SePay Payment Gateway API (CANCLEORDER.md).",
)
async def cancel_sepay_order(
    payload: CancelOrderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = payload.order_invoice_number.strip()
    stmt = select(PaymentTransaction).where(
        (PaymentTransaction.order_code == inv) & (PaymentTransaction.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    transaction = res.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{inv}' not found for current user.",
        )

    if transaction.status == PaymentStatus.SUCCESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel an order that has already been captured and paid.",
        )

    # Call SePay Cancel Order API
    sepay_res = await sepay_service.cancel_order(order_invoice_number=inv)
    msg = sepay_res.get("message", "Đã hủy đơn hàng thành công")

    transaction.status = PaymentStatus.FAILED
    transaction.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return CancelOrderResponse(
        success=True,
        message=msg,
        order_invoice_number=inv,
        status="CANCELLED",
    )


# =========================================================================
# Step 7.5: SePay Connect Custom Account Onboarding
# =========================================================================

@router.get(
    "/sepay/config",
    response_model=SepayMerchantConfigResponse,
    summary="Get User SePay Merchant Integration Config",
    description="Check whether website owner has onboarded and configured their custom SePay merchant account.",
)
async def get_sepay_merchant_config(
    current_user: User = Depends(get_current_user),
):
    is_configured = bool(current_user.sepay_merchant_id and current_user.sepay_secret_key)
    masked_key: Optional[str] = None
    if current_user.sepay_secret_key:
        raw_key = current_user.sepay_secret_key
        if len(raw_key) > 6:
            masked_key = "*" * (len(raw_key) - 4) + raw_key[-4:]
        else:
            masked_key = "****"

    webhook_url = f"{settings.BACKEND_URL}/api/v1/payments/sepay/webhook"

    return SepayMerchantConfigResponse(
        is_configured=is_configured,
        sepay_merchant_id=current_user.sepay_merchant_id,
        sepay_secret_key_masked=masked_key,
        bank_name="MBBank",
        bank_account=None,
        bank_holder=current_user.fullname.upper(),
        webhook_url=webhook_url,
    )


@router.put(
    "/sepay/config",
    response_model=SepayMerchantConfigResponse,
    summary="Update User SePay Merchant Integration",
    description="Save merchant_id and secret_key to allow website owner to receive customer payments directly.",
)
async def update_sepay_merchant_config(
    payload: SepayMerchantConfigRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.sepay_merchant_id = payload.sepay_merchant_id.strip()
    current_user.sepay_secret_key = payload.sepay_secret_key.strip()
    await db.commit()
    await db.refresh(current_user)

    masked_key = "****" + current_user.sepay_secret_key[-4:] if len(current_user.sepay_secret_key) >= 4 else "****"
    webhook_url = f"{settings.BACKEND_URL}/api/v1/payments/sepay/webhook"

    return SepayMerchantConfigResponse(
        is_configured=True,
        sepay_merchant_id=current_user.sepay_merchant_id,
        sepay_secret_key_masked=masked_key,
        bank_name=payload.bank_name or "MBBank",
        bank_account=payload.bank_account,
        bank_holder=payload.bank_holder or current_user.fullname.upper(),
        webhook_url=webhook_url,
    )


# =========================================================================
# Demo / QA Simulation Endpoint
# =========================================================================

@router.post(
    "/sepay/simulate-payment",
    summary="Simulate Instant Payment Confirmation (Demo / QA)",
    description="For testing subscription upgrade or order checkout locally without waiting for bank webhook.",
)
async def simulate_sepay_payment(
    payload: SimulatePaymentRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(PaymentTransaction)
        .options(selectinload(PaymentTransaction.user))
        .where(PaymentTransaction.order_code == payload.order_code.strip())
    )
    res = await db.execute(stmt)
    transaction = res.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with code '{payload.order_code}' was not found.",
        )

    ref_code = payload.reference_code or f"SIM_{secrets.token_hex(4).upper()}"
    transaction.status = PaymentStatus.SUCCESS
    transaction.sepay_transaction_id = ref_code
    transaction.updated_at = datetime.now(timezone.utc)

    # If subscription, upgrade plan & credits
    if transaction.payment_type == PaymentType.SUBSCRIPTION and transaction.user_id:
        bill_stmt = select(Billings).where(Billings.user_id == transaction.user_id)
        bill_res = await db.execute(bill_stmt)
        billing = bill_res.scalar_one_or_none()

        target_plan = Plans.PRO
        credits_to_add = PLAN_CREDITS[Plans.PRO]
        if "ULTIMATE" in transaction.order_code:
            target_plan = Plans.ULTIMATE
            credits_to_add = PLAN_CREDITS[Plans.ULTIMATE]

        if billing:
            billing.plan = target_plan
            billing.credits = max(billing.credits, 0) + credits_to_add
        else:
            new_billing = Billings(
                id=uuid.uuid4(),
                user_id=transaction.user_id,
                plan=target_plan,
                credits=credits_to_add,
            )
            db.add(new_billing)

    await db.commit()

    return {
        "success": True,
        "message": f"Successfully simulated payment for order {payload.order_code}",
        "order_code": transaction.order_code,
        "status": "SUCCESS",
        "sepay_transaction_id": ref_code,
    }
