import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import HTTPException

from app.api.v1.endpoints.auth import forgot_password, verify_reset_otp, reset_password
from app.models.otp import OTPVerification
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    VerifyResetOtpRequest,
    ResetPasswordRequest,
)
from app.core.security import verify_password, get_password_hash


@pytest.mark.asyncio
async def test_forgot_password_user_not_found():
    db = AsyncMock()
    db.scalar.return_value = None

    req = ForgotPasswordRequest(email="nonexistent@example.com")
    with pytest.raises(HTTPException) as exc_info:
        await forgot_password(req, db=db)

    assert exc_info.value.status_code == 404
    assert "chưa được đăng ký" in exc_info.value.detail


@pytest.mark.asyncio
async def test_forgot_password_demo_user_rejected():
    db = AsyncMock()
    demo_user = User(
        id=uuid.uuid4(),
        email="demo@gmail.com",
        fullname="Demo User",
        type="demo",
    )
    db.scalar.return_value = demo_user

    req = ForgotPasswordRequest(email="demo@gmail.com")
    with pytest.raises(HTTPException) as exc_info:
        await forgot_password(req, db=db)

    assert exc_info.value.status_code == 400
    assert "Demo" in exc_info.value.detail


@pytest.mark.asyncio
async def test_forgot_password_success():
    db = AsyncMock()
    user = User(
        id=uuid.uuid4(),
        email="user@example.com",
        fullname="Test User",
        type="owner",
    )
    db.scalar.return_value = user

    with patch("app.api.v1.endpoints.auth.create_and_send_password_reset_otp", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = "123456"
        req = ForgotPasswordRequest(email="user@example.com")
        res = await forgot_password(req, db=db)

        assert res["status"] == 200
        assert "Mã OTP" in res["message"]
        mock_send.assert_awaited_once_with(db, "user@example.com", "Test User")


@pytest.mark.asyncio
async def test_verify_reset_otp_invalid():
    db = AsyncMock()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = None
    db.execute.return_value = result_mock

    req = VerifyResetOtpRequest(email="user@example.com", otp="999999")
    with pytest.raises(HTTPException) as exc_info:
        await verify_reset_otp(req, db=db)

    assert exc_info.value.status_code == 400
    assert "không hợp lệ hoặc đã hết hạn" in exc_info.value.detail


@pytest.mark.asyncio
async def test_verify_reset_otp_expired():
    db = AsyncMock()
    result_mock = MagicMock()
    expired_record = OTPVerification(
        id=uuid.uuid4(),
        email="user@example.com",
        otp_code="123456",
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=5),
    )
    result_mock.scalar_one_or_none.return_value = expired_record
    db.execute.return_value = result_mock

    req = VerifyResetOtpRequest(email="user@example.com", otp="123456")
    with pytest.raises(HTTPException) as exc_info:
        await verify_reset_otp(req, db=db)

    assert exc_info.value.status_code == 400
    assert "hết hạn" in exc_info.value.detail


@pytest.mark.asyncio
async def test_verify_reset_otp_valid():
    db = AsyncMock()
    result_mock = MagicMock()
    valid_record = OTPVerification(
        id=uuid.uuid4(),
        email="user@example.com",
        otp_code="123456",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=8),
    )
    result_mock.scalar_one_or_none.return_value = valid_record
    db.execute.return_value = result_mock

    req = VerifyResetOtpRequest(email="user@example.com", otp="123456")
    res = await verify_reset_otp(req, db=db)

    assert res["status"] == 200
    assert res["message"] == "Mã OTP hợp lệ."


@pytest.mark.asyncio
async def test_reset_password_success():
    db = AsyncMock()
    user = User(
        id=uuid.uuid4(),
        email="user@example.com",
        fullname="Test User",
        type="owner",
        hashed_password=get_password_hash("oldpassword123"),
    )
    db.scalar.return_value = user

    result_mock = MagicMock()
    valid_record = OTPVerification(
        id=uuid.uuid4(),
        email="user@example.com",
        otp_code="654321",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
    )
    result_mock.scalar_one_or_none.return_value = valid_record
    db.execute.return_value = result_mock

    req = ResetPasswordRequest(
        email="user@example.com",
        otp="654321",
        new_password="NewSecretPassword123!",
    )
    res = await reset_password(req, db=db)

    assert res["status"] == 200
    assert "Đặt lại mật khẩu thành công" in res["message"]
    # Verify new password is set
    assert verify_password("NewSecretPassword123!", user.hashed_password)
    assert not verify_password("oldpassword123", user.hashed_password)
    # Check commit called
    db.commit.assert_awaited_once()

