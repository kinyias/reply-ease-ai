import logging
import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.billing import Billings
from app.models.booking import Bookings
from app.models.customer import Customer
from app.models.domain import Domain
from app.models.enums import PaymentStatus, PaymentType, Plans
from app.models.payment_transaction import PaymentTransaction
from app.models.product import Product
from app.models.user import User
from app.schemas.dashboard import (
    AppointmentItem,
    AppointmentsListResponse,
    DashboardMetricsResponse,
    DashboardTransactionItem,
    DashboardTransactionsResponse,
    PlanUsageResponse,
)
from app.services.domain_service import PLAN_DOMAIN_LIMITS, get_user_billing_plan

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/metrics",
    response_model=DashboardMetricsResponse,
    summary="Get Dashboard Core Metrics",
    description="Returns aggregate KPI metrics: potential_clients, pipeline_value, appointments, and total_sales.",
)
async def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardMetricsResponse:
    # 1. Fetch user domain IDs
    domain_stmt = select(Domain.id).where(Domain.user_id == current_user.id)
    domain_res = await db.execute(domain_stmt)
    domain_ids = domain_res.scalars().all()

    # 2. Total sales: sum of completed sales transactions (e.g. PRODUCT_CHECKOUT / customer orders)
    # Exclude system payments like subscription plan upgrades (PaymentType.SUBSCRIPTION)
    sales_conditions = [
        PaymentTransaction.status == PaymentStatus.SUCCESS,
        PaymentTransaction.payment_type.notin_([PaymentType.SUBSCRIPTION, PaymentType.CREDIT_PURCHASE]),
    ]
    if domain_ids:
        sales_conditions.append(
            (PaymentTransaction.domain_id.in_(domain_ids)) | (PaymentTransaction.user_id == current_user.id)
        )
    else:
        sales_conditions.append(PaymentTransaction.user_id == current_user.id)

    sales_stmt = select(func.coalesce(func.sum(PaymentTransaction.amount), 0)).where(*sales_conditions)
    total_sales = (await db.execute(sales_stmt)).scalar() or 0

    if not domain_ids:
        # User has no domains yet
        return DashboardMetricsResponse(
            potential_clients=0,
            pipeline_value=0,
            appointments=0,
            total_sales=int(total_sales),
        )

    # 3. Count potential clients (unique customers under user's domains)
    cust_stmt = select(func.count(Customer.id)).where(Customer.domain_id.in_(domain_ids))
    potential_clients = (await db.execute(cust_stmt)).scalar() or 0

    # 4. Calculate pipeline value: total products price across domains * potential_clients
    prod_stmt = select(func.coalesce(func.sum(Product.price), 0)).where(
        Product.domain_id.in_(domain_ids)
    )
    total_product_price = (await db.execute(prod_stmt)).scalar() or 0
    pipeline_value = int(total_product_price) * int(potential_clients)

    # 5. Count appointments (Bookings for user's domains)
    appt_stmt = select(func.count(Bookings.id)).where(Bookings.domain_id.in_(domain_ids))
    appointments = (await db.execute(appt_stmt)).scalar() or 0

    return DashboardMetricsResponse(
        potential_clients=int(potential_clients),
        pipeline_value=int(pipeline_value),
        appointments=int(appointments),
        total_sales=int(total_sales),
    )


@router.get(
    "/plan-usage",
    response_model=PlanUsageResponse,
    summary="Get Subscription Plan Usage Status",
    description="Returns current plan, credits balance, domain usage vs quota limit, and total clients.",
)
async def get_dashboard_plan_usage(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlanUsageResponse:
    # 1. Billing Plan & Credits
    plan, credits = await get_user_billing_plan(db, current_user)
    max_domains = PLAN_DOMAIN_LIMITS.get(plan, 1)

    # 2. Domains count
    domain_stmt = select(Domain.id).where(Domain.user_id == current_user.id)
    domain_res = await db.execute(domain_stmt)
    domain_ids = domain_res.scalars().all()
    domains_used = len(domain_ids)

    # 3. Clients count
    clients_count = 0
    if domain_ids:
        cust_stmt = select(func.count(Customer.id)).where(Customer.domain_id.in_(domain_ids))
        clients_count = (await db.execute(cust_stmt)).scalar() or 0

    return PlanUsageResponse(
        plan=plan.value,
        credits=credits,
        domains_used=domains_used,
        max_domains=max_domains,
        clients_count=int(clients_count),
    )


@router.get(
    "/transactions",
    response_model=DashboardTransactionsResponse,
    summary="Get Recent Financial Transactions",
    description="Returns recent payment transactions (completed and pending) for user and user's domains.",
)
async def get_dashboard_transactions(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardTransactionsResponse:
    # Fetch user domain IDs
    domain_stmt = select(Domain.id).where(Domain.user_id == current_user.id)
    domain_res = await db.execute(domain_stmt)
    domain_ids = domain_res.scalars().all()

    # Query PaymentTransactions with domain & customer relationships loaded
    conditions = [PaymentTransaction.user_id == current_user.id]
    if domain_ids:
        conditions.append(PaymentTransaction.domain_id.in_(domain_ids))

    from sqlalchemy import or_
    stmt = (
        select(PaymentTransaction)
        .options(
            selectinload(PaymentTransaction.domain),
            selectinload(PaymentTransaction.customer),
        )
        .where(or_(*conditions))
        .order_by(desc(PaymentTransaction.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    transactions = result.scalars().all()

    # Total count of user transactions
    count_stmt = select(func.count(PaymentTransaction.id)).where(or_(*conditions))
    total = (await db.execute(count_stmt)).scalar() or 0

    items = [
        DashboardTransactionItem(
            id=tx.id,
            order_code=tx.order_code,
            amount=tx.amount,
            payment_type=tx.payment_type.value if hasattr(tx.payment_type, "value") else str(tx.payment_type),
            status=tx.status.value if hasattr(tx.status, "value") else str(tx.status),
            content=tx.content,
            sepay_transaction_id=tx.sepay_transaction_id,
            created_at=tx.created_at,
            domain_name=tx.domain.name if tx.domain else None,
            customer_email=tx.customer.email if tx.customer else None,
        )
        for tx in transactions
    ]

    return DashboardTransactionsResponse(
        transactions=items,
        total=int(total),
    )


@router.get(
    "/appointments",
    response_model=AppointmentsListResponse,
    summary="Get Appointments List",
    description="Returns customer appointments booked under the user's domains, with optional search, domain filter, and pagination.",
)
async def get_dashboard_appointments(
    search: Optional[str] = Query(None, description="Tìm theo email khách hàng hoặc khung giờ"),
    domain_id: Optional[uuid.UUID] = Query(None, description="Lọc theo domain cụ thể"),
    page: Optional[int] = Query(None, ge=1, description="Trang (bắt đầu từ 1)"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Số lượng mục mỗi trang"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AppointmentsListResponse:
    # 1. Fetch user domain IDs
    domain_stmt = select(Domain.id).where(Domain.user_id == current_user.id)
    domain_res = await db.execute(domain_stmt)
    user_domain_ids = domain_res.scalars().all()

    if not user_domain_ids:
        return AppointmentsListResponse(
            appointments=[],
            total=0,
            today_count=0,
            page=page or 1,
            page_size=page_size or 10,
            total_pages=1,
        )

    # Filter target domain
    if domain_id:
        if domain_id not in user_domain_ids:
            return AppointmentsListResponse(
                appointments=[],
                total=0,
                today_count=0,
                page=page or 1,
                page_size=page_size or 10,
                total_pages=1,
            )
        target_domain_ids = [domain_id]
    else:
        target_domain_ids = user_domain_ids

    # 2. Build filter conditions
    where_conditions = [Bookings.domain_id.in_(target_domain_ids)]
    if search and search.strip():
        term = f"%{search.strip()}%"
        where_conditions.append(or_(Bookings.email.ilike(term), Bookings.slot.ilike(term)))

    # 3. Count total matching bookings
    count_stmt = select(func.count(Bookings.id)).where(*where_conditions)
    count_res = await db.execute(count_stmt)
    total = count_res.scalar_one() or 0

    # 4. Count today's bookings across all user's domains
    now_utc = datetime.now(timezone.utc)
    today_date = now_utc.date()
    today_stmt = (
        select(Bookings.id, Bookings.date)
        .where(Bookings.domain_id.in_(user_domain_ids))
    )
    today_res = await db.execute(today_stmt)
    all_user_bookings = today_res.all()
    today_count = sum(
        1 for row in all_user_bookings
        if (row[1].date() if hasattr(row[1], "date") else row[1]) == today_date
    )

    # 5. Fetch bookings with optional pagination
    stmt = (
        select(Bookings)
        .options(
            selectinload(Bookings.domain),
            selectinload(Bookings.customer),
        )
        .where(*where_conditions)
        .order_by(desc(Bookings.date), desc(Bookings.created_at))
    )

    if page is not None and page_size is not None:
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    elif page_size is not None:
        stmt = stmt.limit(page_size)

    res = await db.execute(stmt)
    bookings = res.scalars().all()

    items: List[AppointmentItem] = [
        AppointmentItem(
            id=b.id,
            date=b.date,
            slot=b.slot,
            email=b.email,
            domain_id=b.domain_id,
            domain_name=b.domain.name if b.domain else None,
            customer_id=b.customer_id,
            created_at=b.created_at,
        )
        for b in bookings
    ]

    eff_page = page or 1
    eff_size = page_size or (len(items) if items else 10)
    total_pages = math.ceil(total / eff_size) if total > 0 and eff_size > 0 else 1

    return AppointmentsListResponse(
        appointments=items,
        total=total if (page is not None or page_size is not None) else len(items),
        today_count=today_count,
        page=eff_page,
        page_size=eff_size,
        total_pages=total_pages,
    )

