import enum


class Plans(str, enum.Enum):
    STANDARD = "STANDARD"
    PRO = "PRO"
    ULTIMATE = "ULTIMATE"


class Role(str, enum.Enum):
    user = "user"
    assistant = "assistant"


class PaymentType(str, enum.Enum):
    SUBSCRIPTION = "SUBSCRIPTION"
    PRODUCT_CHECKOUT = "PRODUCT_CHECKOUT"
    CREDIT_PURCHASE = "CREDIT_PURCHASE"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
