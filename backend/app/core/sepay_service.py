import base64
import hashlib
import hmac
import logging
import re
import urllib.parse
from typing import Any, Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class SePayService:
    """
    SePay Service for handling:
    1. Dynamic VietQR code generation.
    2. SePay Payment Gateway checkout fields signing (HMAC-SHA256 base64) compatible with sepay-pg-node.
    3. Webhook / IPN signature verification.
    4. Order code parsing from transaction contents.
    """

    SIGNED_FIELDS_ORDER: List[str] = [
        "merchant",
        "env",
        "operation",
        "payment_method",
        "order_amount",
        "currency",
        "order_invoice_number",
        "order_description",
        "customer_id",
        "agreement_id",
        "agreement_name",
        "agreement_type",
        "agreement_payment_frequency",
        "agreement_amount_per_payment",
        "success_url",
        "error_url",
        "cancel_url",
        "order_id",
    ]

    def __init__(
        self,
        merchant_id: Optional[str] = None,
        secret_key: Optional[str] = None,
        webhook_api_key: Optional[str] = None,
        env: str = "sandbox",
    ):
        self.merchant_id = merchant_id or settings.SEPAY_MERCHANT_ID
        self.secret_key = secret_key or settings.SEPAY_SECRET_KEY
        self.webhook_api_key = webhook_api_key or settings.SEPAY_WEBHOOK_API_KEY
        self.env = env
        self.default_bank_code = "MBBank"
        self.default_bank_account = "0333888999"
        self.default_bank_holder = "REPLY EASE STORE"

    @property
    def base_checkout_url(self) -> str:
        """Returns the checkout initialization URL depending on environment."""
        if self.env == "sandbox":
            return "https://pay-sandbox.sepay.vn/v1/checkout/init"
        return "https://pay.sepay.vn/v1/checkout/init"

    def generate_vietqr_url(
        self,
        bank_account: Optional[str] = None,
        bank_code: Optional[str] = None,
        amount: int = 0,
        content: str = "",
    ) -> str:
        """
        Generate direct VietQR image URL for SePay bank transfer matching.
        Format: https://qr.sepay.vn/img?acc={account}&bank={bank}&amount={amount}&des={content}
        """
        account = bank_account or self.default_bank_account
        bank = bank_code or self.default_bank_code
        safe_content = urllib.parse.quote_plus(content.strip())
        return f"https://qr.sepay.vn/img?acc={account}&bank={bank}&amount={amount}&des={safe_content}"

    def sign_checkout_fields(
        self,
        fields: Dict[str, Any],
        secret_key: Optional[str] = None,
    ) -> str:
        """
        Compute HMAC-SHA256 signature encoded in base64, identical to sepay-pg-node Checkout.signFields:
        Filters allowed fields in order, joins them as 'key=value' separated by commas,
        then HMAC-SHA256 hashes with secret_key and encodes in base64.
        """
        key = (secret_key or self.secret_key or "").encode("utf-8")
        signed_parts: List[str] = []

        for field in self.SIGNED_FIELDS_ORDER:
            if field in fields and fields[field] is not None:
                val = str(fields[field])
                signed_parts.append(f"{field}={val}")

        data_string = ",".join(signed_parts)
        signature = hmac.new(
            key,
            data_string.encode("utf-8"),
            hashlib.sha256,
        ).digest()

        return base64.b64encode(signature).decode("utf-8")

    def build_checkout_payload(
        self,
        order_invoice_number: str,
        order_amount: int,
        order_description: str,
        success_url: Optional[str] = None,
        error_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        customer_id: Optional[str] = None,
        custom_merchant_id: Optional[str] = None,
        custom_secret_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Builds the complete payment fields required by SePay Payment Gateway
        including the cryptographic signature.
        """
        merchant = custom_merchant_id or self.merchant_id or "REPLY_EASE_MERCHANT"
        secret = custom_secret_key or self.secret_key or "REPLY_EASE_SECRET"

        fields: Dict[str, Any] = {
            "merchant": merchant,
            "operation": "PURCHASE",
            "payment_method": "BANK_TRANSFER",
            "order_amount": int(order_amount),
            "currency": "VND",
            "order_invoice_number": order_invoice_number,
            "order_description": order_description,
            "success_url": success_url or f"{settings.FRONTEND_URL}/billing?success=true",
            "error_url": error_url or f"{settings.FRONTEND_URL}/billing?error=true",
            "cancel_url": cancel_url or f"{settings.FRONTEND_URL}/billing?cancel=true",
        }

        if customer_id:
            fields["customer_id"] = str(customer_id)

        signature = self.sign_checkout_fields(fields, secret_key=secret)
        fields["signature"] = signature

        return {
            "checkout_url": self.base_checkout_url,
            "payment_fields": fields,
        }

    def verify_webhook_signature(
        self,
        authorization_header: Optional[str] = None,
        sepay_signature_header: Optional[str] = None,
        raw_body: bytes = b"",
        custom_secret_key: Optional[str] = None,
    ) -> bool:
        """
        Validate incoming webhook from SePay:
        1. If API Key header 'Authorization: Apikey <KEY>' is present, compare against webhook_api_key.
        2. If 'x-sepay-signature' is present, compare against HMAC-SHA256 of raw_body with secret_key.
        3. If no webhook_api_key is configured in dev/sandbox, allow gracefully with warning.
        """
        expected_api_key = self.webhook_api_key

        # Check API Key Header
        if authorization_header and authorization_header.startswith("Apikey "):
            provided_key = authorization_header.replace("Apikey ", "").strip()
            if expected_api_key and provided_key == expected_api_key:
                return True
            if not expected_api_key:
                # If server didn't configure a webhook key, accept and log
                logger.info("SePay Webhook received with API Key: accepted in permissive mode")
                return True
            return False

        # Check HMAC signature header
        if sepay_signature_header and raw_body:
            secret = (custom_secret_key or self.secret_key or "").encode("utf-8")
            expected_sig_hex = hmac.new(
                secret,
                raw_body,
                hashlib.sha256,
            ).hexdigest()
            expected_sig_b64 = base64.b64encode(
                hmac.new(secret, raw_body, hashlib.sha256).digest()
            ).decode("utf-8")

            if (
                hmac.compare_digest(sepay_signature_header, expected_sig_hex)
                or hmac.compare_digest(sepay_signature_header, expected_sig_b64)
            ):
                return True

        # In development without keys configured, permit requests
        if not expected_api_key and settings.ENVIRONMENT == "development":
            return True

        return False

    def extract_order_code_from_content(self, content: str) -> Optional[str]:
        """
        Extract unique order code from bank transfer memo/content string.
        Examples:
        - "RE891234 nang cap goi Pro" -> "RE891234"
        - "SUB_PRO_A1B2C3 SePay" -> "SUB_PRO_A1B2C3"
        - "SUB_ULTIMATE_987654" -> "SUB_ULTIMATE_987654"
        - "SEPAY INV-12345" -> "INV-12345"
        """
        if not content:
            return None

        # Pattern 1: Subscription code SUB_PRO_xxx or SUB_ULTIMATE_xxx
        match_sub = re.search(r"\b(SUB_(?:PRO|ULTIMATE|STD)_[A-Za-z0-9]+)\b", content, re.IGNORECASE)
        if match_sub:
            return match_sub.group(1).upper()

        # Pattern 2: ReplyEase prefix RE + digits/letters (e.g. RE123456 or RE987ABC)
        match_re = re.search(r"\b(RE[0-9A-Z]{6,10})\b", content, re.IGNORECASE)
        if match_re:
            return match_re.group(1).upper()

        # Pattern 3: Invoice format INV-xxx
        match_inv = re.search(r"\b(INV-[A-Za-z0-9_-]+)\b", content, re.IGNORECASE)
        if match_inv:
            return match_inv.group(1).upper()

        # Pattern 4: General alphanumeric token starting with capital letters
        match_general = re.search(r"\b([A-Z]{2,4}[0-9]{4,10})\b", content)
        if match_general:
            return match_general.group(1).upper()

        return None


# Global singleton instance
sepay_service = SePayService()
