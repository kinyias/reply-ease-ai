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

    subject = f"{otp_code} is your ReplyEase AI verification code"
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
          <h2 class="title">ReplyEase AI</h2>
          <span class="badge">Account Registration Verification</span>
        </div>
        <p class="desc">Hello,<br>You requested to register an account on <strong>ReplyEase AI</strong>. Please use the verification code below to complete your registration:</p>
        <div class="code-box">
          <div class="code">{otp_code}</div>
        </div>
        <p class="desc">This code is valid for <strong>10 minutes</strong>. If you did not make this request, please safely ignore this email.</p>
        <div class="footer">
          &copy; 2026 ReplyEase AI. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

    await send_email(
        to_email=email,
        subject=subject,
        html_content=html_content,
        text_content=f"Your ReplyEase AI verification code is: {otp_code}. Valid for 10 minutes.",
    )

    return otp_code


async def create_and_send_password_reset_otp(
    db: AsyncSession,
    email: str,
    fullname: Optional[str] = None,
) -> str:
    """Generate, store, and send a 6-digit OTP code for password reset."""
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
    print(f"🔑 [DEV RESET OTP] Code for {email}: {otp_code}")
    print(f"==========================================\n")

    user_greeting = f"Xin chào {fullname}," if fullname else "Xin chào,"
    subject = f"{otp_code} là mã xác nhận đặt lại mật khẩu ReplyEase AI của bạn"
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
        .badge {{ background: #fee2e2; color: #dc2626; font-weight: 600; padding: 4px 12px; border-radius: 9999px; font-size: 13px; display: inline-block; margin-top: 8px; }}
        .code-box {{ background: #f5f5f5; border: 2px dashed #f87171; border-radius: 10px; text-align: center; padding: 20px; margin: 24px 0; }}
        .code {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #dc2626; font-family: monospace; }}
        .desc {{ color: #666; font-size: 14px; line-height: 1.6; }}
        .notice {{ background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 13px; color: #92400e; margin: 16px 0; }}
        .footer {{ font-size: 12px; color: #999; text-align: center; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 class="title">ReplyEase AI</h2>
          <span class="badge">Yêu cầu khôi phục mật khẩu</span>
        </div>
        <p class="desc">{user_greeting}<br>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>{email}</strong> trên ReplyEase AI. Vui lòng sử dụng mã OTP bên dưới để xác nhận:</p>
        <div class="code-box">
          <div class="code">{otp_code}</div>
        </div>
        <div class="notice">
          ⚠️ Mã này có hiệu lực trong <strong>10 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
        </div>
        <p class="desc">Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua thư hoặc đổi mật khẩu ngay để bảo mật tài khoản.</p>
        <div class="footer">
          &copy; 2026 ReplyEase AI. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

    await send_email(
        to_email=email,
        subject=subject,
        html_content=html_content,
        text_content=f"Mã xác thực đặt lại mật khẩu ReplyEase AI của bạn là: {otp_code}. Có hiệu lực trong 10 phút.",
    )

    return otp_code


async def send_live_chat_alert(
    owner_email: str,
    domain_name: str,
    customer_email: Optional[str],
    last_message: str,
) -> bool:
    """Send an alert to the domain owner that a customer requires live human support."""
    subject = f"🚨 [Live Chat Alert] Customer requested support on {domain_name}"
    customer_label = customer_email or "Khách truy cập ẩn danh (Chưa cung cấp email)"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff8f0; padding: 20px; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #ffd4aa; box-shadow: 0 4px 14px rgba(255, 122, 0, 0.08); }}
        .header {{ margin-bottom: 20px; border-bottom: 1px solid #f0f0f0; padding-bottom: 16px; }}
        .badge {{ background: #ff4d4f; color: #fff; font-weight: 700; padding: 4px 10px; border-radius: 6px; font-size: 12px; text-transform: uppercase; }}
        .title {{ color: #1f1f1f; font-size: 20px; font-weight: 700; margin: 12px 0 4px 0; }}
        .meta {{ color: #666; font-size: 13px; }}
        .bubble {{ background: #fdf5ec; border-left: 4px solid #ff7a00; border-radius: 4px; padding: 12px 16px; margin: 20px 0; font-size: 14px; color: #333; }}
        .btn {{ display: inline-block; background: #ff7a00; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 10px; }}
        .footer {{ font-size: 12px; color: #999; margin-top: 24px; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">Can thiệp Trực tiếp (Live Mode)</span>
          <h2 class="title">Khách hàng cần bạn hỗ trợ!</h2>
          <div class="meta">Domain: <strong>{domain_name}</strong> &bull; Khách: <strong>{customer_label}</strong></div>
        </div>
        <p style="font-size: 14px; color: #555;">Một khách hàng trên website vừa gửi yêu cầu hỗ trợ mà Trợ lý AI đã chuyển tiếp sang chế độ Người thật tư vấn:</p>
        <div class="bubble">
          <strong>Nội dung tin nhắn:</strong><br>
          &ldquo;{last_message}&rdquo;
        </div>
        <p style="font-size: 13px; color: #666;">Vui lòng truy cập trang Quản lý Hội thoại (Conversations) để trả lời trực tiếp cho khách hàng trong thời gian sớm nhất.</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="{settings.FRONTEND_URL}/conversation" class="btn" style="color: #ffffff;">Mở Live Messenger</a>
        </div>
        <div class="footer">
          &copy; 2026 ReplyEase AI &bull; Smart Sales Chatbot Platform
        </div>
      </div>
    </body>
    </html>
    """

    return await send_email(
        to_email=owner_email,
        subject=subject,
        html_content=html_content,
        text_content=f"[Live Alert] Customer ({customer_label}) on {domain_name} needs human assistance:\n\n{last_message}\n\nPlease check your ReplyEase dashboard.",
    )


async def send_marketing_campaign_bulk(
    campaign_name: str,
    template_content: str,
    recipient_emails: list[str],
) -> dict:
    """Send marketing campaign emails to multiple recipients in the background."""
    logger.info(
        "Starting background bulk marketing campaign '%s' for %d recipients",
        campaign_name,
        len(recipient_emails),
    )
    success_count = 0
    failure_count = 0

    for email in recipient_emails:
        try:
            personalized_content = template_content.replace("{{email}}", email)
            # If not full HTML document, wrap in responsive template
            if "<html" not in personalized_content.lower():
                html_body = f"""
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }}
                    .header {{ background: #ff7a00; padding: 24px 32px; color: #ffffff; text-align: left; }}
                    .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; }}
                    .content {{ padding: 32px; font-size: 15px; line-height: 1.6; color: #334155; }}
                    .footer {{ background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }}
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>{campaign_name}</h1>
                    </div>
                    <div class="content">
                      {personalized_content.replace(chr(10), '<br>')}
                    </div>
                    <div class="footer">
                      <p style="margin: 0 0 4px 0;">Email được gửi tự động qua hệ thống CSKH ReplyEase AI.</p>
                      <p style="margin: 0;">Bạn nhận thư này vì đã tương tác trên website đối tác của chúng tôi.</p>
                    </div>
                  </div>
                </body>
                </html>
                """
            else:
                html_body = personalized_content

            sent = await send_email(
                to_email=email,
                subject=campaign_name,
                html_content=html_body,
                text_content=personalized_content,
            )
            if sent:
                success_count += 1
            else:
                failure_count += 1
        except Exception as e:
            logger.error("Error sending marketing email to %s: %s", email, str(e))
            failure_count += 1

    logger.info(
        "Completed bulk campaign '%s': %d succeeded, %d failed",
        campaign_name,
        success_count,
        failure_count,
    )
    return {
        "total": len(recipient_emails),
        "success": success_count,
        "failure": failure_count,
    }


