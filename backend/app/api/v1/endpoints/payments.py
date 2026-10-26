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
    Plans.STANDARD: 10,
    Plans.PRO: 50,
    Plans.ULTIMATE: 500,
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

    # 2. Generate unique memorable order code for VietQR
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

    # 5. Build SePay Gateway checkout fields (compatible with sepay-pg-node)
    checkout_payload = sepay_service.build_checkout_payload(
        order_invoice_number=order_code,
        order_amount=amount,
        order_description=description,
        customer_id=str(current_user.id),
        success_url=f"{settings.FRONTEND_URL}/billing?order_code={order_code}&status=success",
        error_url=f"{settings.FRONTEND_URL}/billing?order_code={order_code}&status=error",
        cancel_url=f"{settings.FRONTEND_URL}/billing?order_code={order_code}&status=cancel",
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
# Step 7.3: SePay Webhook Handler (Auto Reconciliation)
# =========================================================================

@router.post(
    "/sepay/webhook",
    summary="SePay IPN Webhook Receiver",
    description="Receives bank transfer balance notifications from SePay, reconciles transaction, and activates subscription or fulfills order.",
)
async def sepay_webhook_handler(
    request: Request,
    response: Response,
    authorization: Optional[str] = Header(None),
    x_sepay_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    raw_body = await request.body()
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    logger.info("Received SePay Webhook payload: %s", payload)

    # 1. Signature / API Key verification
    is_valid = sepay_service.verify_webhook_signature(
        authorization_header=authorization,
        sepay_signature_header=x_sepay_signature,
        raw_body=raw_body,
    )
    if not is_valid:
        logger.warning("SePay Webhook rejected: Invalid signature or API key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Webhook signature or authorization key.",
        )

    # 2. Extract transfer content and order code
    content = payload.get("content", "") or ""
    order_inv = payload.get("order_invoice_number") or payload.get("code")
    transfer_amount = payload.get("transferAmount") or payload.get("accumulated") or 0
    ref_code = str(payload.get("referenceCode") or payload.get("id") or "")

    extracted_code = order_inv or sepay_service.extract_order_code_from_content(content)

    if not extracted_code:
        logger.warning("Could not extract order_code from SePay webhook content: '%s'", content)
        # Still return 200 to SePay so it does not retry indefinitely for unrecognised memos
        return {
            "success": False,
            "message": "Order code not recognized in transfer description",
        }

    # 3. Match PaymentTransaction in database
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
        # Fallback: search if order_code is substring of content
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

    # 4. Idempotency Check
    if transaction.status == PaymentStatus.SUCCESS:
        logger.info("Order %s already processed with SUCCESS. Acknowledging webhook.", transaction.order_code)
        return {
            "success": True,
            "message": "Transaction was already completed previously.",
        }

    # 5. Verify transfer amount (with tolerance for demo/testing)
    if transfer_amount and int(transfer_amount) < transaction.amount:
        logger.warning(
            "Transfer amount %s is less than required %s for order %s",
            transfer_amount,
            transaction.amount,
            transaction.order_code,
        )

    # 6. Mark Transaction as SUCCESS
    transaction.status = PaymentStatus.SUCCESS
    transaction.sepay_transaction_id = ref_code
    transaction.updated_at = datetime.now(timezone.utc)

    # 7. Upgrade User Subscription if SUBSCRIPTION payment
    if transaction.payment_type == PaymentType.SUBSCRIPTION and transaction.user_id:
        # Load user billings
        bill_stmt = select(Billings).where(Billings.user_id == transaction.user_id)
        bill_res = await db.execute(bill_stmt)
        billing = bill_res.scalar_one_or_none()

        # Determine target plan
        target_plan = Plans.PRO
        credits_to_add = PLAN_CREDITS[Plans.PRO]

        if "ULTIMATE" in transaction.order_code:
            target_plan = Plans.ULTIMATE
            credits_to_add = PLAN_CREDITS[Plans.ULTIMATE]

        if billing:
            billing.plan = target_plan
            billing.credits = max(billing.credits, 0) + credits_to_add
            logger.info(
                "Upgraded user %s billing to %s with +%s credits",
                transaction.user_id,
                target_plan.value,
                credits_to_add,
            )
        else:
            new_billing = Billings(
                id=uuid.uuid4(),
                user_id=transaction.user_id,
                plan=target_plan,
                credits=credits_to_add,
            )
            db.add(new_billing)
            logger.info(
                "Created new billing for user %s with plan %s and %s credits",
                transaction.user_id,
                target_plan.value,
                credits_to_add,
            )

    await db.commit()
    logger.info("SePay Webhook processed successfully for order: %s", transaction.order_code)

    response.status_code = status.HTTP_200_OK
    return {
        "success": True,
        "message": "Transaction processed successfully",
        "order_code": transaction.order_code,
    }


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
