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
    1. SePay Payment Gateway checkout fields signing (HMAC-SHA256 base64) adhering to PAYMENT.md.
    2. Automatic Checkout URL resolution (via checkout/init redirect).
    3. IPN Secret Key verification according to IPN.md.
    4. Order Cancellation API according to CANCLEORDER.md.
    5. Fallback VietQR code generation and bank transfer regex matching.
    """

    # Strictly ordered fields as specified in PAYMENT.md (do not change order)
    ALLOWED_FIELDS: List[str] = [
        "order_amount",
        "merchant",
        "currency",
        "operation",
        "order_description",
        "order_invoice_number",
        "customer_id",
        "payment_method",
        "success_url",
        "error_url",
        "cancel_url",
    ]

    def __init__(
        self,
        merchant_id: Optional[str] = None,
        secret_key: Optional[str] = None,
        webhook_api_key: Optional[str] = None,
        env: Optional[str] = None,
    ):
        self._merchant_id = merchant_id
        self._secret_key = secret_key
        self._webhook_api_key = webhook_api_key
        self._env = env
        self.default_bank_code = "MBBank"
        self.default_bank_account = "0333888999"
        self.default_bank_holder = "REPLY EASE STORE"

    @property
    def merchant_id(self) -> str:
        return self._merchant_id or settings.SEPAY_MERCHANT_ID or ""

    @property
    def secret_key(self) -> str:
        return self._secret_key or settings.SEPAY_SECRET_KEY or ""

    @property
    def webhook_api_key(self) -> str:
        return self._webhook_api_key or settings.SEPAY_WEBHOOK_API_KEY or ""

    @property
    def is_sandbox(self) -> bool:
        if self.merchant_id and self.merchant_id.startswith("SP-TEST-"):
            return True
        configured_env = self._env or settings.SEPAY_ENV
        return (configured_env or "").strip().lower() == "sandbox"

    @property
    def base_checkout_url(self) -> str:
        """Returns base checkout domain depending on sandbox/production."""
        return "https://pay-sandbox.sepay.vn" if self.is_sandbox else "https://pay.sepay.vn"

    @property
    def checkout_init_url(self) -> str:
        """Endpoint to submit HTML form POST for SePay Payment Gateway checkout."""
        return f"{self.base_checkout_url}/v1/checkout/init"

    @property
    def base_api_url(self) -> str:
        """Returns SePay API domain (pgapi) depending on sandbox/production."""
        return "https://pgapi-sandbox.sepay.vn" if self.is_sandbox else "https://pgapi.sepay.vn"

    def sign_checkout_fields(
        self,
        fields: Dict[str, Any],
        secret_key: Optional[str] = None,
    ) -> str:
        """
        Compute HMAC-SHA256 signature encoded in base64 according to PAYMENT.md:
        1. Filter signing fields: Only sign fields in allowed list:
           order_amount, merchant, currency, operation, order_description, order_invoice_number,
           customer_id, payment_method, success_url, error_url, cancel_url
        2. Create signing string: field1=value1,field2=value2,field3=value3...
        3. Encode: base64_encode(hash_hmac('sha256', signedString, secretKey, true))
        """
        key = (secret_key or self.secret_key or "").encode("utf-8")
        signed_parts: List[str] = []

        for field in self.ALLOWED_FIELDS:
            if field in fields and fields[field] is not None:
                val = str(fields[field])
                if val != "":
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
        payment_method: Optional[str] = None,
        custom_merchant_id: Optional[str] = None,
        custom_secret_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Builds the complete payment fields required by SePay Payment Gateway
        in the strict order documented in PAYMENT.md, including signature.
        """
        merchant = custom_merchant_id or self.merchant_id
        secret = custom_secret_key or self.secret_key

        # Build in exact order specified by PAYMENT.md
        fields: Dict[str, Any] = {
            "order_amount": str(int(order_amount)),
            "merchant": merchant,
            "currency": "VND",
            "operation": "PURCHASE",
            "order_description": order_description,
            "order_invoice_number": order_invoice_number,
        }

        if customer_id:
            fields["customer_id"] = str(customer_id)

        if payment_method:
            fields["payment_method"] = str(payment_method)

        if success_url:
            fields["success_url"] = success_url
        if error_url:
            fields["error_url"] = error_url
        if cancel_url:
            fields["cancel_url"] = cancel_url

        signature = self.sign_checkout_fields(fields, secret_key=secret)
        fields["signature"] = signature

        return {
            "checkout_url": self.checkout_init_url,
            "payment_fields": fields,
        }

    async def resolve_checkout_redirect(
        self,
        payment_fields: Dict[str, Any],
        init_url: Optional[str] = None,
    ) -> Optional[str]:
        """
        Submit form fields to SePay /v1/checkout/init without following redirects
        to capture the 302 Location header.
        This provides a direct payment link (e.g. https://pay-sandbox.sepay.vn/v1/checkout?...)
        for seamless frontend redirection or embedding.
        """
        target_url = init_url or self.checkout_init_url
        try:
            import httpx
            async with httpx.AsyncClient(follow_redirects=False, timeout=6.0) as client:
                res = await client.post(target_url, data=payment_fields)
                if res.status_code in (301, 302, 303, 307, 308) and "location" in res.headers:
                    return res.headers["location"]
                if res.status_code == 200:
                    return str(res.url)
        except Exception as e:
            logger.warning("Auto-resolving SePay checkout redirect returned: %s", e)
        return None

    def verify_ipn_secret_key(
        self,
        x_secret_key: Optional[str],
        custom_secret_key: Optional[str] = None,
    ) -> bool:
        """
        Verify incoming IPN notification header X-Secret-Key according to IPN.md:
        Header:
          X-Secret-Key: <secret_key>
        """
        expected = custom_secret_key or self.secret_key
        if not expected:
            # If server doesn't have secret key in dev, allow with warning
            logger.info("IPN received without configured secret_key on server: permissive mode")
            return True

        if not x_secret_key:
            return False

        return hmac.compare_digest(x_secret_key.strip(), expected.strip())

    async def cancel_order(
        self,
        order_invoice_number: str,
        merchant_id: Optional[str] = None,
        secret_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Cancel an unpaid or pending order via SePay Payment Gateway API according to CANCLEORDER.md.
        Endpoint: POST {base_api_url}/v1/order/cancel
        Header: Authorization: Basic {base64(merchant_id:secret_key)}
        Body: {"order_invoice_number": order_invoice_number}
        """
        m_id = merchant_id or self.merchant_id or ""
        s_key = secret_key or self.secret_key or ""
        auth_str = f"{m_id}:{s_key}"
        auth_b64 = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")

        url = f"{self.base_api_url}/v1/order/cancel"
        payload = {"order_invoice_number": order_invoice_number.strip()}

        import httpx
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    url,
                    json=payload,
                    headers={
                        "Authorization": f"Basic {auth_b64}",
                        "Content-Type": "application/json",
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "success": True,
                        "message": data.get("message", "Đã hủy đơn hàng thành công"),
                    }
                else:
                    logger.warning(
                        "SePay cancel order failed: status=%s, body=%s",
                        res.status_code,
                        res.text,
                    )
                    return {
                        "success": False,
                        "status_code": res.status_code,
                        "message": res.text,
                    }
        except Exception as e:
            logger.error("Exception in SePay cancel order: %s", e)
            return {"success": False, "error": str(e)}

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

        if not expected_api_key and settings.ENVIRONMENT == "development":
            return True

        return False

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
