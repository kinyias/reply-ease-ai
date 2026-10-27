import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DashboardMetricsResponse(BaseModel):
    potential_clients: int = Field(..., description="Total count of customer leads across user domains")
    pipeline_value: int = Field(..., description="Estimated sales pipeline value in VND (product prices * potential clients)")
    appointments: int = Field(..., description="Total count of scheduled bookings across user domains")
    total_sales: int = Field(..., description="Total actual sales revenue from completed SePay transactions in VND")


class PlanUsageResponse(BaseModel):
    plan: str = Field(..., description="Current subscription plan (STANDARD, PRO, ULTIMATE)")
    credits: int = Field(..., description="Remaining AI & Email credits")
    domains_used: int = Field(..., description="Number of domains currently created by user")
    max_domains: int = Field(..., description="Maximum domain quota allowed by subscription")
    clients_count: int = Field(..., description="Total customer leads across user domains")


class DashboardTransactionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_code: str
    amount: int
    payment_type: str
    status: str
    content: str
    sepay_transaction_id: Optional[str] = None
    created_at: datetime
    domain_name: Optional[str] = None
    customer_email: Optional[str] = None


class DashboardTransactionsResponse(BaseModel):
    transactions: List[DashboardTransactionItem]
    total: int


class AppointmentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    date: datetime
    slot: str
    email: str
    domain_id: Optional[uuid.UUID] = None
    domain_name: Optional[str] = None
    customer_id: Optional[uuid.UUID] = None
    created_at: datetime


class AppointmentsListResponse(BaseModel):
    appointments: List[AppointmentItem]
    total: int
    today_count: int
