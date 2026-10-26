import logging
import secrets
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import cast, Date, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.booking import Bookings
from app.models.customer import Customer
from app.models.customer_response import CustomerResponses
from app.models.domain import Domain
from app.models.enums import PaymentStatus, PaymentType
from app.models.payment_transaction import PaymentTransaction
from app.models.product import Product
from app.schemas.portal import (
    BookedSlotItem,
    CustomerResponseItem,
    PortalAnswerItem,
    PortalAppointmentData,
    PortalBookAppointmentRequest,
    PortalBookingResponse,
    PortalCreateOrderRequest,
    PortalOrderResponse,
    PortalOrderStatusResponse,
    PortalPaymentData,
    PortalProductItem,
    PortalSimulatePaymentRequest,
    PortalSubmitAnswersRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# =========================================================================
# Appointment Portal Endpoints
# =========================================================================

@router.get(
    "/{domain_id}/appointment/{customer_id}",
    response_model=PortalAppointmentData,
    summary="Get Appointment Portal Data",
    description="Retrieve customer profile, unanswered/answered qualifier questions, and existing booked slots for the domain.",
)
async def get_appointment_portal_data(
    domain_id: uuid.UUID,
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    # 1. Fetch domain
    domain_stmt = select(Domain).where(Domain.id == domain_id)
    domain_res = await db.execute(domain_stmt)
    domain = domain_res.scalar_one_or_none()
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain with ID '{domain_id}' not found.",
        )

    # 2. Fetch customer with responses
    cust_stmt = (
        select(Customer)
        .options(selectinload(Customer.questions))
        .where(Customer.id == customer_id, Customer.domain_id == domain_id)
    )
    cust_res = await db.execute(cust_stmt)
    customer = cust_res.scalar_one_or_none()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID '{customer_id}' not found for this domain.",
        )

    # 3. Fetch existing domain bookings
    book_stmt = (
        select(Bookings)
        .where(Bookings.domain_id == domain_id)
        .order_by(Bookings.date.asc())
    )
    book_res = await db.execute(book_stmt)
    bookings = book_res.scalars().all()

    question_items = [
        CustomerResponseItem(
            id=q.id,
            question=q.question,
            answered=q.answered,
        )
        for q in customer.questions
    ]

    booked_slot_items = [
        BookedSlotItem(
            id=b.id,
            date=b.date,
            slot=b.slot,
            email=b.email,
        )
        for b in bookings
    ]

    return PortalAppointmentData(
        domain_id=domain.id,
        domain_name=domain.name,
        domain_icon=domain.icon,
        customer_id=customer.id,
        email=customer.email,
        questions=question_items,
        booked_slots=booked_slot_items,
    )


@router.post(
    "/{domain_id}/appointment/{customer_id}",
    response_model=PortalBookingResponse,
    summary="Book Customer Appointment",
    description="Save answers to remaining qualifier questions, check slot availability, and book an appointment.",
)
async def book_customer_appointment(
    domain_id: uuid.UUID,
    customer_id: uuid.UUID,
    payload: PortalBookAppointmentRequest,
    db: AsyncSession = Depends(get_db),
):
    # 1. Fetch domain and customer
    domain_stmt = select(Domain).where(Domain.id == domain_id)
    domain_res = await db.execute(domain_stmt)
    domain = domain_res.scalar_one_or_none()
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain with ID '{domain_id}' not found.",
        )

    cust_stmt = (
        select(Customer)
        .options(selectinload(Customer.questions))
        .where(Customer.id == customer_id, Customer.domain_id == domain_id)
    )
    cust_res = await db.execute(cust_stmt)
    customer = cust_res.scalar_one_or_none()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID '{customer_id}' not found.",
        )

    # 2. Check slot collision on the same calendar day
    target_date = payload.date.date()
    existing_stmt = select(Bookings).where(
        Bookings.domain_id == domain_id,
        cast(Bookings.date, Date) == target_date,
        func.lower(Bookings.slot) == payload.slot.strip().lower(),
    )
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Khung giờ '{payload.slot}' vào ngày {target_date.strftime('%d/%m/%Y')} đã có người đặt trước. Vui lòng chọn khung giờ khác.",
        )

    # 3. Update questions answers if submitted
    if payload.answers:
        answer_map = {ans.id: ans.answered for ans in payload.answers}
        for q in customer.questions:
            if q.id in answer_map:
                q.answered = answer_map[q.id].strip()

    # 4. Sync customer email if updated
    if payload.email and customer.email != payload.email:
        customer.email = payload.email.strip().lower()

    # 5. Create new Bookings record
    new_booking = Bookings(
        id=uuid.uuid4(),
        date=payload.date,
        slot=payload.slot.strip(),
        email=payload.email.strip().lower(),
        customer_id=customer.id,
        domain_id=domain.id,
    )
    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)

    return PortalBookingResponse(
        id=new_booking.id,
        date=new_booking.date,
        slot=new_booking.slot,
        email=new_booking.email,
        customer_id=customer.id,
        domain_id=domain.id,
        domain_name=domain.name,
        message="Cuộc hẹn đã được ghi nhận thành công!",
    )


@router.post(
    "/answers/{customer_id}",
    response_model=List[CustomerResponseItem],
    summary="Update Customer Responses",
    description="Save answers to customer qualifier / filter questions.",
)
async def update_customer_answers(
    customer_id: uuid.UUID,
    payload: PortalSubmitAnswersRequest,
    db: AsyncSession = Depends(get_db),
):
    cust_stmt = (
        select(Customer)
        .options(selectinload(Customer.questions))
        .where(Customer.id == customer_id)
    )
    cust_res = await db.execute(cust_stmt)
    customer = cust_res.scalar_one_or_none()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID '{customer_id}' not found.",
        )

    answer_map = {ans.id: ans.answered for ans in payload.answers}
    for q in customer.questions:
        if q.id in answer_map:
            q.answered = answer_map[q.id].strip()

    await db.commit()
    await db.refresh(customer)

    return [
        CustomerResponseItem(
            id=q.id,
            question=q.question,
            answered=q.answered,
        )
        for q in customer.questions
    ]


# =========================================================================
# Payment & Checkout Portal Endpoints
# =========================================================================

@router.get(
    "/{domain_id}/payment/{customer_id}",
    response_model=PortalPaymentData,
    summary="Get Product Checkout Portal Data",
    description="Retrieve domain product catalog, total bill, customer answers, and payment configuration.",
)
async def get_payment_portal_data(
    domain_id: uuid.UUID,
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    # 1. Fetch domain with user
    domain_stmt = (
        select(Domain)
        .options(selectinload(Domain.user))
        .where(Domain.id == domain_id)
    )
    domain_res = await db.execute(domain_stmt)
    domain = domain_res.scalar_one_or_none()
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain with ID '{domain_id}' not found.",
        )

    # 2. Fetch customer with questions
    cust_stmt = (
        select(Customer)
        .options(selectinload(Customer.questions))
        .where(Customer.id == customer_id, Customer.domain_id == domain_id)
    )
    cust_res = await db.execute(cust_stmt)
    customer = cust_res.scalar_one_or_none()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID '{customer_id}' not found for this domain.",
        )

    # 3. Fetch domain products
    prod_stmt = (
        select(Product)
        .where(Product.domain_id == domain_id)
        .order_by(Product.created_at.desc())
    )
    prod_res = await db.execute(prod_stmt)
    products = prod_res.scalars().all()

    total_amount = sum(p.price for p in products)

    product_items = [
        PortalProductItem(
            id=p.id,
            name=p.name,
            price=p.price,
            image=p.image,
        )
        for p in products
    ]

    question_items = [
        CustomerResponseItem(
            id=q.id,
            question=q.question,
            answered=q.answered,
        )
        for q in customer.questions
    ]

    # Store bank account details (configured or default demo)
    bank_name = "MBBank"
    bank_account = "0333888999"
    bank_holder = domain.user.fullname.upper() if domain.user and domain.user.fullname else "REPLY EASE STORE"

    return PortalPaymentData(
        domain_id=domain.id,
        domain_name=domain.name,
        domain_icon=domain.icon,
        customer_id=customer.id,
        email=customer.email,
        products=product_items,
        total_amount=total_amount,
        questions=question_items,
        sepay_configured=True,
        bank_name=bank_name,
        bank_account=bank_account,
        bank_holder=bank_holder,
    )


@router.post(
    "/{domain_id}/payment/{customer_id}/create-order",
    response_model=PortalOrderResponse,
    summary="Create Customer Order & Payment Code",
    description="Generate a unique VietQR code / Stripe Elements intent for customer checkout.",
)
async def create_portal_order(
    domain_id: uuid.UUID,
    customer_id: uuid.UUID,
    payload: PortalCreateOrderRequest,
    db: AsyncSession = Depends(get_db),
):
    domain_stmt = (
        select(Domain)
        .options(selectinload(Domain.user))
        .where(Domain.id == domain_id)
    )
    domain_res = await db.execute(domain_stmt)
    domain = domain_res.scalar_one_or_none()
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain with ID '{domain_id}' not found.",
        )

    cust_stmt = select(Customer).where(
        Customer.id == customer_id, Customer.domain_id == domain_id
    )
    cust_res = await db.execute(cust_stmt)
    customer = cust_res.scalar_one_or_none()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID '{customer_id}' not found.",
        )

    # 1. Calculate amount from products
    prod_stmt = select(Product).where(Product.domain_id == domain_id)
    if payload.product_ids and len(payload.product_ids) > 0:
        prod_stmt = prod_stmt.where(Product.id.in_(payload.product_ids))
    prod_res = await db.execute(prod_stmt)
    products = prod_res.scalars().all()

    total_amount = sum(p.price for p in products)
    if total_amount <= 0:
        total_amount = 50000  # Default minimum fallback amount

    # 2. Update customer email if provided
    if payload.email and customer.email != payload.email:
        customer.email = payload.email.strip().lower()

    # 3. Generate unique order code (e.g. REA839123)
    random_suffix = secrets.token_hex(3).upper()
    order_code = f"ORD{random_suffix}"

    bank_name = "MBBank"
    bank_account = "0333888999"
    bank_holder = domain.user.fullname.upper() if domain.user and domain.user.fullname else "REPLY EASE STORE"

    # VietQR generation URL
    qr_url = f"https://qr.sepay.vn/img?acc={bank_account}&bank={bank_name}&amount={total_amount}&des={order_code}"

    # Stripe client secret for Card checkout option
    client_secret = f"pi_{uuid.uuid4().hex[:20]}_secret_{secrets.token_hex(10)}"

    # 4. Save PaymentTransaction
    transaction = PaymentTransaction(
        id=uuid.uuid4(),
        order_code=order_code,
        amount=total_amount,
        payment_type=PaymentType.PRODUCT_CHECKOUT,
        status=PaymentStatus.PENDING,
        content=order_code,
        customer_id=customer.id,
        domain_id=domain.id,
        user_id=domain.user_id,
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)

    return PortalOrderResponse(
        order_code=order_code,
        amount=total_amount,
        payment_method=payload.payment_method,
        qr_url=qr_url,
        bank=bank_name,
        account_number=bank_account,
        account_name=bank_holder,
        content=order_code,
        client_secret=client_secret if payload.payment_method == "stripe" else None,
        status=transaction.status.value,
        created_at=transaction.created_at,
    )


@router.get(
    "/payment/status/{order_code}",
    response_model=PortalOrderStatusResponse,
    summary="Check Order Payment Status",
    description="Poll payment status of an order transaction.",
)
async def check_order_payment_status(
    order_code: str,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PaymentTransaction).where(PaymentTransaction.order_code == order_code.strip())
    res = await db.execute(stmt)
    transaction = res.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_code}' not found.",
        )

    return PortalOrderStatusResponse(
        order_code=transaction.order_code,
        status=transaction.status.value,
        amount=transaction.amount,
        payment_type=transaction.payment_type.value,
        created_at=transaction.created_at,
    )


@router.post(
    "/payment/simulate-confirm",
    summary="Simulate Payment Confirmation (Demo / QA)",
    description="Mark an order payment transaction as SUCCESS for QA, testing, and demo flows.",
)
async def simulate_order_payment(
    payload: PortalSimulatePaymentRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PaymentTransaction).where(PaymentTransaction.order_code == payload.order_code.strip())
    res = await db.execute(stmt)
    transaction = res.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{payload.order_code}' not found.",
        )

    transaction.status = PaymentStatus.SUCCESS
    transaction.sepay_transaction_id = f"SIM_{secrets.token_hex(6).upper()}"
    await db.commit()
    await db.refresh(transaction)

    return {
        "success": True,
        "message": f"Order {transaction.order_code} successfully marked as PAID.",
        "order_code": transaction.order_code,
        "status": transaction.status.value,
        "sepay_transaction_id": transaction.sepay_transaction_id,
    }
