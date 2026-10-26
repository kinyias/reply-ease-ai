import logging
import random
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Optional

import aiosmtplib
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.otp import OTPVerification

logger = logging.getLogger(__name__)


def generate_otp_code() -> str:
    """Generate a random 6-digit OTP string."""
    return f"{random.randint(100000, 999999)}"


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
) -> bool:
    """Send an async email via aiosmtplib."""
    # If SMTP is not configured in local development, log to console
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "[DEV MODE] SMTP not configured. Simulated email to: %s | Subject: %s",
            to_email,
            subject,
        )
        return True

    try:
        message = EmailMessage()
        from_email = settings.SMTP_USER or "support@replyease.ai"
        message["From"] = f"{settings.SMTP_FROM_NAME} <{from_email}>"
        message["To"] = to_email
        message["Subject"] = subject

        if text_content:
            message.set_content(text_content)
        else:
            message.set_content("Please enable HTML to view this email.")

        message.add_alternative(html_content, subtype="html")

        # Determine TLS / SSL based on port
        use_tls = settings.SMTP_PORT == 465
        start_tls = settings.SMTP_PORT == 587
        smtp_password = settings.SMTP_PASSWORD.replace(" ", "") if settings.SMTP_PASSWORD else None

        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=smtp_password,
            use_tls=use_tls,
            start_tls=start_tls,
            timeout=15,
        )
        logger.info("Email sent successfully to %s", to_email)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, str(e))
        return False


async def create_and_send_otp(db: AsyncSession, email: str) -> str:
    """Generate, store, and send a 6-digit OTP verification code."""
    # Clean up any existing OTP for this email
    await db.execute(delete(OTPVerification).where(OTPVerification.email == email))

    otp_code = generate_otp_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    otp_entry = OTPVerification(
        email=email,
        otp_code=otp_code,
        expires_at=expires_at,
    )
    db.add(otp_entry)
    await db.commit()

    # Log in console for development/testing ease
    print(f"\n==========================================")
    print(f"🔑 [DEV OTP] Code for {email}: {otp_code}")
    print(f"==========================================\n")

    subject = f"{otp_code} là mã xác thực đăng ký tài khoản Reply-Ease AI"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9f9f9; padding: 20px; }}
        .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .title {{ color: #171717; font-size: 22px; font-weight: bold; margin: 0; }}
        .badge {{ background: #ffe0bd; color: #ff7a00; font-weight: 600; padding: 4px 12px; border-radius: 9999px; font-size: 13px; display: inline-block; margin-top: 8px; }}
        .code-box {{ background: #f5f5f5; border: 2px dashed #ffc989; border-radius: 10px; text-align: center; padding: 20px; margin: 24px 0; }}
        .code {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ff7a00; font-family: monospace; }}
        .desc {{ color: #666; font-size: 14px; line-height: 1.6; }}
        .footer {{ font-size: 12px; color: #999; text-align: center; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 class="title">Reply-Ease AI</h2>
          <span class="badge">Xác thực đăng ký tài khoản</span>
        </div>
        <p class="desc">Xin chào,<br>Bạn vừa yêu cầu đăng ký tài khoản trên nền tảng <strong>Reply-Ease AI</strong>. Hãy sử dụng mã OTP dưới đây để hoàn tất quá trình xác thực:</p>
        <div class="code-box">
          <div class="code">{otp_code}</div>
        </div>
        <p class="desc">Mã xác thực này có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
        <div class="footer">
          &copy; 2026 Reply-Ease AI. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

    await send_email(
        to_email=email,
        subject=subject,
        html_content=html_content,
        text_content=f"Mã OTP xác thực đăng ký Reply-Ease AI của bạn là: {otp_code}. Mã có hiệu lực trong 10 phút.",
    )

    return otp_code
