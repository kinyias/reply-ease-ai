import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PaymentStatus, PaymentType, Plans


class CreatePaymentRequest(BaseModel):
    payment_type: PaymentType = Field(
        default=PaymentType.SUBSCRIPTION,
        description="Type of payment: SUBSCRIPTION or PRODUCT_CHECKOUT",
    )
    plan: Optional[Plans] = Field(
        default=None,
        description="Required if payment_type is SUBSCRIPTION (PRO or ULTIMATE)",
    )
    domain_id: Optional[uuid.UUID] = Field(
        default=None,
        description="Optional domain ID if tied to a specific domain or product checkout",
    )
    product_ids: Optional[List[uuid.UUID]] = Field(
        default=None,
        description="Optional list of products for checkout",
    )
    amount: Optional[int] = Field(
        default=None,
        description="Optional override amount in VND. If not provided, computed from plan or products.",
    )
    description: Optional[str] = Field(
        default=None,
        description="Custom order description",
    )


class PaymentResponse(BaseModel):
    order_code: str
    amount: int
    payment_type: PaymentType
    qr_url: str
    bank_name: str
    bank_account: str
    account_name: str
    content: str
    checkout_url: str
    direct_checkout_url: Optional[str] = None
    payment_fields: Dict[str, Any]
    plan: Optional[Plans] = None
    created_at: datetime


class PaymentStatusResponse(BaseModel):
    order_code: str
    status: PaymentStatus
    amount: int
    payment_type: PaymentType
    sepay_transaction_id: Optional[str] = None
    content: Optional[str] = None
    plan: Optional[Plans] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class PaymentTransactionItem(BaseModel):
    id: uuid.UUID
    order_code: str
    amount: int
    payment_type: PaymentType
    status: PaymentStatus
    content: str
    sepay_transaction_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionListResponse(BaseModel):
    transactions: List[PaymentTransactionItem]
    total: int


class SepayMerchantConfigRequest(BaseModel):
    sepay_merchant_id: str = Field(..., description="SePay Merchant ID from my.sepay.vn")
    sepay_secret_key: str = Field(..., description="SePay Secret Key from my.sepay.vn")
    bank_name: Optional[str] = Field(default="MBBank", description="Receiving bank name")
    bank_account: Optional[str] = Field(default=None, description="Receiving bank account number")
    bank_holder: Optional[str] = Field(default=None, description="Receiving bank account holder name")


class SepayMerchantConfigResponse(BaseModel):
    is_configured: bool
    sepay_merchant_id: Optional[str] = None
    sepay_secret_key_masked: Optional[str] = None
    bank_name: Optional[str] = "MBBank"
    bank_account: Optional[str] = None
    bank_holder: Optional[str] = None
    webhook_url: str


class SepayWebhookPayload(BaseModel):
    id: Optional[int] = None
    gateway: Optional[str] = None
    transactionDate: Optional[str] = None
    accountNumber: Optional[str] = None
    code: Optional[str] = None
    content: Optional[str] = None
    transferType: Optional[str] = None
    transferAmount: Optional[int] = None
    accumulated: Optional[int] = None
    subAccount: Optional[str] = None
    referenceCode: Optional[str] = None
    description: Optional[str] = None
    order_invoice_number: Optional[str] = None


class SimulatePaymentRequest(BaseModel):
    order_code: str = Field(..., description="The unique order code to mark as SUCCESS")
    transfer_amount: Optional[int] = Field(
        default=None, description="Optional override of transferred amount"
    )
    reference_code: Optional[str] = Field(
        default=None, description="Simulated bank reference code"
    )


class CancelOrderRequest(BaseModel):
    order_invoice_number: str = Field(..., description="Order code / invoice number to cancel")


class CancelOrderResponse(BaseModel):
    success: bool
    message: str
    order_invoice_number: str
    status: Optional[str] = None


class SepayIpnOrder(BaseModel):
    id: Optional[str] = None
    order_id: Optional[str] = None
    order_status: Optional[str] = None
    order_currency: Optional[str] = "VND"
    order_amount: Optional[str] = None
    order_invoice_number: Optional[str] = None
    order_description: Optional[str] = None


class SepayIpnTransaction(BaseModel):
    id: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    transaction_type: Optional[str] = None
    transaction_status: Optional[str] = None
    transaction_amount: Optional[str] = None
    transaction_currency: Optional[str] = "VND"


class SepayIpnPayload(BaseModel):
    timestamp: Optional[int] = None
    notification_type: str = "ORDER_PAID"
    order: Optional[SepayIpnOrder] = None
    transaction: Optional[SepayIpnTransaction] = None

