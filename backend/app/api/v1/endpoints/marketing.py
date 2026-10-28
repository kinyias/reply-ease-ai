import math
import re
import uuid
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.customer import Customer
from app.models.customer_response import CustomerResponses
from app.models.domain import Domain
from app.models.user import User
from app.schemas.marketing import (
    CampaignCreateRequest,
    CampaignCustomersUpdateRequest,
    CampaignListResponse,
    CampaignResponse,
    CampaignSendRequest,
    CampaignSendResponse,
    CampaignTemplateUpdateRequest,
    CampaignUpdateRequest,
    CustomerLeadItem,
    CustomerLeadListResponse,
    CustomerQuestionAnswerBrief,
)
from app.services.email_service import send_marketing_campaign_bulk

router = APIRouter()

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")


def validate_clean_emails(emails: List[str]) -> List[str]:
    """Filter out invalid emails and deduplicate while preserving order."""
    cleaned = []
    seen = set()
    for e in emails:
        if not e:
            continue
        trimmed = e.strip().lower()
        if trimmed and EMAIL_REGEX.match(trimmed) and trimmed not in seen:
            seen.add(trimmed)
            cleaned.append(trimmed)
    return cleaned


# ==============================================================================
# CAMPAIGN CRUD & TEMPLATES
# ==============================================================================

@router.get("/campaigns", response_model=CampaignListResponse)
async def list_campaigns(
    search: Optional[str] = Query(None, description="Tìm theo tên chiến dịch"),
    page: Optional[int] = Query(None, ge=1, description="Trang (bắt đầu từ 1)"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Số lượng mục mỗi trang"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lấy danh sách chiến dịch email marketing của user hiện tại với tìm kiếm và phân trang."""
    where_conditions = [Campaign.user_id == current_user.id]
    if search and search.strip():
        where_conditions.append(Campaign.name.ilike(f"%{search.strip()}%"))

    # Total count query
    count_stmt = select(func.count(Campaign.id)).where(*where_conditions)
    count_res = await db.execute(count_stmt)
    total = count_res.scalar_one() or 0

    stmt = (
        select(Campaign)
        .where(*where_conditions)
        .order_by(Campaign.created_at.desc())
    )

    if page is not None and page_size is not None:
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    elif page_size is not None:
        stmt = stmt.limit(page_size)

    result = await db.execute(stmt)
    campaigns = result.scalars().all()

    items = [
        CampaignResponse(
            id=c.id,
            name=c.name,
            customers=c.customers if isinstance(c.customers, list) else [],
            template=c.template,
            user_id=c.user_id,
            created_at=c.created_at,
            updated_at=c.updated_at,
            recipients_count=len(c.customers) if isinstance(c.customers, list) else 0,
        )
        for c in campaigns
    ]

    eff_page = page or 1
    eff_size = page_size or (len(items) if items else 10)
    total_pages = math.ceil(total / eff_size) if total > 0 and eff_size > 0 else 1

    return CampaignListResponse(
        campaigns=items,
        total=total if (page is not None or page_size is not None) else len(items),
        page=eff_page,
        page_size=eff_size,
        total_pages=total_pages,
    )



@router.post("/campaigns", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    payload: CampaignCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Tạo mới một chiến dịch email marketing."""
    cleaned_customers = validate_clean_emails(payload.customers or [])

    new_campaign = Campaign(
        name=payload.name.strip(),
        template=payload.template,
        customers=cleaned_customers,
        user_id=current_user.id,
    )
    db.add(new_campaign)
    await db.commit()
    await db.refresh(new_campaign)

    return CampaignResponse(
        id=new_campaign.id,
        name=new_campaign.name,
        customers=new_campaign.customers,
        template=new_campaign.template,
        user_id=new_campaign.user_id,
        created_at=new_campaign.created_at,
        updated_at=new_campaign.updated_at,
        recipients_count=len(new_campaign.customers),
    )


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lấy thông tin chi tiết một chiến dịch."""
    stmt = select(Campaign).where(
        Campaign.id == campaign_id, Campaign.user_id == current_user.id
    )
    result = await db.execute(stmt)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chiến dịch không tồn tại hoặc bạn không có quyền truy cập",
        )

    return CampaignResponse(
        id=campaign.id,
        name=campaign.name,
        customers=campaign.customers if isinstance(campaign.customers, list) else [],
        template=campaign.template,
        user_id=campaign.user_id,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        recipients_count=len(campaign.customers) if isinstance(campaign.customers, list) else 0,
    )


@router.put("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: uuid.UUID,
    payload: CampaignUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cập nhật chiến dịch (tên, mẫu template, hoặc danh sách người nhận)."""
    stmt = select(Campaign).where(
        Campaign.id == campaign_id, Campaign.user_id == current_user.id
    )
    result = await db.execute(stmt)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chiến dịch không tồn tại",
        )

    if payload.name is not None:
        campaign.name = payload.name.strip()
    if payload.template is not None:
        campaign.template = payload.template
    if payload.customers is not None:
        campaign.customers = validate_clean_emails(payload.customers)

    await db.commit()
    await db.refresh(campaign)

    return CampaignResponse(
        id=campaign.id,
        name=campaign.name,
        customers=campaign.customers if isinstance(campaign.customers, list) else [],
        template=campaign.template,
        user_id=campaign.user_id,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        recipients_count=len(campaign.customers) if isinstance(campaign.customers, list) else 0,
    )


@router.delete("/campaigns/{campaign_id}", status_code=status.HTTP_200_OK)
async def delete_campaign(
    campaign_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Xóa một chiến dịch."""
    stmt = select(Campaign).where(
        Campaign.id == campaign_id, Campaign.user_id == current_user.id
    )
    result = await db.execute(stmt)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chiến dịch không tồn tại",
        )

    await db.delete(campaign)
    await db.commit()

    return {"message": "Đã xóa chiến dịch thành công", "id": str(campaign_id)}


@router.put("/campaigns/{campaign_id}/template", response_model=CampaignResponse)
async def update_campaign_template(
    campaign_id: uuid.UUID,
    payload: CampaignTemplateUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lưu nội dung email template cho chiến dịch."""
    stmt = select(Campaign).where(
        Campaign.id == campaign_id, Campaign.user_id == current_user.id
    )
    result = await db.execute(stmt)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chiến dịch không tồn tại",
        )

    campaign.template = payload.template
    await db.commit()
    await db.refresh(campaign)

    return CampaignResponse(
        id=campaign.id,
        name=campaign.name,
        customers=campaign.customers if isinstance(campaign.customers, list) else [],
        template=campaign.template,
        user_id=campaign.user_id,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        recipients_count=len(campaign.customers) if isinstance(campaign.customers, list) else 0,
    )


@router.put("/campaigns/{campaign_id}/customers", response_model=CampaignResponse)
async def assign_campaign_customers(
    campaign_id: uuid.UUID,
    payload: CampaignCustomersUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gán danh sách các email khách hàng vào chiến dịch."""
    stmt = select(Campaign).where(
        Campaign.id == campaign_id, Campaign.user_id == current_user.id
    )
    result = await db.execute(stmt)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chiến dịch không tồn tại",
        )

    cleaned = validate_clean_emails(payload.customers)
    campaign.customers = cleaned
    await db.commit()
    await db.refresh(campaign)

    return CampaignResponse(
        id=campaign.id,
        name=campaign.name,
        customers=campaign.customers,
        template=campaign.template,
        user_id=campaign.user_id,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        recipients_count=len(campaign.customers),
    )


# ==============================================================================
# LEAD FILTERING & INSPECTION
# ==============================================================================

@router.get("/customers", response_model=CustomerLeadListResponse)
async def list_marketing_customers(
    domain_id: Optional[uuid.UUID] = Query(None, description="Lọc theo domain cụ thể"),
    search: Optional[str] = Query(None, description="Tìm theo email khách hoặc câu trả lời"),
    only_with_email: bool = Query(True, description="Chỉ lấy khách hàng đã có email"),
    page: Optional[int] = Query(None, ge=1, description="Trang (bắt đầu từ 1)"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Số lượng mục mỗi trang"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lấy danh sách khách hàng tiềm năng thuộc các domain của user,
    bao gồm chi tiết câu trả lời, hỗ trợ tìm kiếm và phân trang.
    """
    # Lấy danh sách domain IDs thuộc về user
    user_domains_stmt = select(Domain.id, Domain.name).where(Domain.user_id == current_user.id)
    domains_res = await db.execute(user_domains_stmt)
    domain_map = {d[0]: d[1] for d in domains_res.all()}

    if not domain_map:
        return CustomerLeadListResponse(
            customers=[],
            total=0,
            page=page or 1,
            page_size=page_size or 10,
            total_pages=1,
        )

    target_domain_ids = [domain_id] if domain_id and domain_id in domain_map else list(domain_map.keys())

    stmt = (
        select(Customer)
        .where(Customer.domain_id.in_(target_domain_ids))
        .options(
            selectinload(Customer.questions),
            selectinload(Customer.domain),
        )
        .order_by(Customer.created_at.desc())
    )

    if only_with_email:
        stmt = stmt.where(Customer.email.isnot(None), Customer.email != "")

    result = await db.execute(stmt)
    customers = result.scalars().all()

    leads: List[CustomerLeadItem] = []
    search_lower = search.strip().lower() if search else None

    for c in customers:
        responses = [
            CustomerQuestionAnswerBrief(
                id=q.id,
                question=q.question,
                answered=q.answered,
            )
            for q in (c.questions or [])
        ]
        answered_count = sum(1 for q in responses if q.answered and q.answered.strip())
        total_questions = len(responses)

        # Apply search filter if specified
        if search_lower:
            email_match = c.email and (search_lower in c.email.lower())
            answer_match = any(
                (q.answered and search_lower in q.answered.lower()) or (search_lower in q.question.lower())
                for q in responses
            )
            if not (email_match or answer_match):
                continue

        leads.append(
            CustomerLeadItem(
                id=c.id,
                email=c.email,
                domain_id=c.domain_id,
                domain_name=domain_map.get(c.domain_id) or (c.domain.name if c.domain else None),
                created_at=c.created_at,
                responses=responses,
                answered_count=answered_count,
                total_questions=total_questions,
            )
        )

    total_leads = len(leads)
    eff_page = page or 1
    eff_size = page_size or (total_leads if total_leads > 0 else 10)
    total_pages = math.ceil(total_leads / eff_size) if total_leads > 0 and eff_size > 0 else 1

    if page is not None and page_size is not None:
        start_idx = (page - 1) * page_size
        leads = leads[start_idx : start_idx + page_size]

    return CustomerLeadListResponse(
        customers=leads,
        total=total_leads,
        page=eff_page,
        page_size=eff_size,
        total_pages=total_pages,
    )



# ==============================================================================
# BULK MAILER VIA BACKGROUND TASKS & CREDITS DECREMENT
# ==============================================================================

@router.post("/campaigns/{campaign_id}/send", response_model=CampaignSendResponse)
async def send_campaign_bulk_mailer(
    campaign_id: uuid.UUID,
    payload: Optional[CampaignSendRequest] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Gửi email marketing hàng loạt qua background task, trừ credits tương ứng số lượng email gửi:
    1. Kiểm tra campaign và template nội dung email.
    2. Xác định danh sách email người nhận (từ payload hoặc campaign.customers).
    3. Kiểm tra số dư credits còn lại trong Billings.
    4. Trừ credits trong bảng Billings: credits = credits - len(emails).
    5. Đưa tác vụ gửi email vào BackgroundTasks không phong tỏa server.
    """
    stmt = select(Campaign).where(
        Campaign.id == campaign_id, Campaign.user_id == current_user.id
    )
    result = await db.execute(stmt)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chiến dịch không tồn tại",
        )

    # Validate template content
    if not campaign.template or not campaign.template.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chiến dịch chưa có nội dung email template. Vui lòng soạn mẫu email trước khi gửi.",
        )

    # Determine recipients
    raw_recipients = payload.emails if payload and payload.emails is not None else campaign.customers
    recipient_emails = validate_clean_emails(raw_recipients or [])

    if not recipient_emails:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không có người nhận hợp lệ nào được chọn cho chiến dịch.",
        )

    needed_credits = len(recipient_emails)

    # Check user credits
    subscription = current_user.subscription
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không tìm thấy thông tin gói dịch vụ và credits của tài khoản.",
        )

    if subscription.credits < needed_credits:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Không đủ credits. Chiến dịch cần {needed_credits} credits để gửi tới "
                f"{needed_credits} khách hàng, nhưng tài khoản hiện chỉ còn {subscription.credits} credits. "
                "Vui lòng nạp thêm hoặc nâng cấp gói tại trang Gói cước & Thanh toán."
            ),
        )

    # Decrement credits
    subscription.credits -= needed_credits
    await db.commit()
    await db.refresh(subscription)

    # Dispatch non-blocking bulk mailing via background tasks
    background_tasks.add_task(
        send_marketing_campaign_bulk,
        campaign_name=campaign.name,
        template_content=campaign.template,
        recipient_emails=recipient_emails,
    )

    return CampaignSendResponse(
        message=f"Đã lên lịch gửi chiến dịch '{campaign.name}' thành công tới {needed_credits} khách hàng.",
        campaign_id=campaign.id,
        total_recipients=needed_credits,
        credits_deducted=needed_credits,
        remaining_credits=subscription.credits,
    )
