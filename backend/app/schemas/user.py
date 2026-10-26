import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr
from app.models.enums import Plans


class BillingBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan: Plans
    credits: int


class DomainBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    icon: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    fullname: str
    email: EmailStr
    type: str
    sepay_merchant_id: Optional[str] = None
    created_at: datetime
    subscription: Optional[BillingBrief] = None
    domains: List[DomainBrief] = []


class UserUpdateProfileRequest(BaseModel):
    fullname: Optional[str] = None
    sepay_merchant_id: Optional[str] = None
    sepay_secret_key: Optional[str] = None
