import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ==========================================
# Common / Question Schemas
# ==========================================

class CustomerResponseItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    question: str
    answered: Optional[str] = None


class PortalAnswerItem(BaseModel):
    id: uuid.UUID
    question: Optional[str] = None
    answered: str = Field(..., min_length=1)


class PortalSubmitAnswersRequest(BaseModel):
    answers: List[PortalAnswerItem]


# ==========================================
# Appointment Portal Schemas
# ==========================================

class BookedSlotItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    date: datetime
    slot: str
    email: str


class PortalAppointmentData(BaseModel):
    domain_id: uuid.UUID
    domain_name: str
    domain_icon: Optional[str] = None
    customer_id: uuid.UUID
    email: Optional[str] = None
    questions: List[CustomerResponseItem] = []
    booked_slots: List[BookedSlotItem] = []


class PortalBookAppointmentRequest(BaseModel):
    date: datetime
    slot: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    answers: Optional[List[PortalAnswerItem]] = None


class PortalBookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    date: datetime
    slot: str
    email: str
    customer_id: Optional[uuid.UUID] = None
    domain_id: Optional[uuid.UUID] = None
    domain_name: Optional[str] = None
    message: str = "Appointment booked successfully"


# ==========================================
# Product Payment & Checkout Schemas
# ==========================================

class PortalProductItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    price: int  # in VND
    image: str


class PortalPaymentData(BaseModel):
    domain_id: uuid.UUID
    domain_name: str
    domain_icon: Optional[str] = None
    customer_id: uuid.UUID
    email: Optional[str] = None
    products: List[PortalProductItem] = []
    total_amount: int
    questions: List[CustomerResponseItem] = []
    sepay_configured: bool = True
    bank_name: Optional[str] = "MBBank"
    bank_account: Optional[str] = "0333888999"
    bank_holder: Optional[str] = "REPLY EASE STORE"


class PortalCreateOrderRequest(BaseModel):
    product_ids: Optional[List[uuid.UUID]] = None
    email: Optional[EmailStr] = None
    payment_method: str = Field(default="vietqr", description="'vietqr' or 'stripe'")


class PortalOrderResponse(BaseModel):
    order_code: str
    amount: int
    payment_method: str
    qr_url: Optional[str] = None
    bank: Optional[str] = None
    account_number: Optional[str] = None
    account_name: Optional[str] = None
    content: Optional[str] = None
    client_secret: Optional[str] = None
    status: str
    created_at: datetime


class PortalOrderStatusResponse(BaseModel):
    order_code: str
    status: str
    amount: int
    payment_type: str
    created_at: datetime


class PortalSimulatePaymentRequest(BaseModel):
    order_code: str
