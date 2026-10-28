import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.billing import Billings
from app.models.enums import Plans
from app.models.otp import OTPVerification
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    GenerateOTPRequest,
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    VerifyOTPRequest,
)
from app.schemas.user import UserResponse
from app.services.email_service import create_and_send_otp

router = APIRouter()


@router.post(
    "/register/generate-otp",
    status_code=status.HTTP_200_OK,
    summary="Generate and send OTP code for registration",
)
async def generate_otp(
    req: GenerateOTPRequest,
    db: AsyncSession = Depends(get_db),
):
    # Check if email is already registered
    existing_user = await db.scalar(select(User).where(User.email == req.email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered. Please sign in.",
        )

    await create_and_send_otp(db, req.email)
    return {
        "status": 200,
        "message": "Verification OTP code has been sent to your email.",
    }


@router.post(
    "/register/verify",
    status_code=status.HTTP_201_CREATED,
    response_model=dict,
    summary="Verify OTP and complete user registration",
)
async def verify_and_register(
    req: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
):
    # Check if user already exists
    existing_user = await db.scalar(select(User).where(User.email == req.email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered.",
        )

    # Check OTP
    stmt = (
        select(OTPVerification)
        .where(
            OTPVerification.email == req.email,
            OTPVerification.otp_code == req.otp,
        )
        .order_by(OTPVerification.created_at.desc())
    )
    result = await db.execute(stmt)
    otp_record = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if not otp_record or otp_record.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code.",
        )

    # Create new User
    new_user = User(
        fullname=req.fullname,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        type=req.type,
    )
    db.add(new_user)
    await db.flush()  # populate new_user.id

    # Create Default Billings Subscription (STANDARD with 100 credits)
    subscription = Billings(
        user_id=new_user.id,
        plan=Plans.STANDARD,
        credits=100,
    )
    db.add(subscription)

    # Delete used OTP
    await db.execute(delete(OTPVerification).where(OTPVerification.email == req.email))

    await db.commit()
    await db.refresh(new_user)

    # Generate Tokens
    access_token = create_access_token(new_user.id)
    refresh_token = create_refresh_token(new_user.id)

    return {
        "status": 201,
        "message": "Account registered successfully!",
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        },
        "user": {
            "id": str(new_user.id),
            "fullname": new_user.fullname,
            "email": new_user.email,
            "type": new_user.type,
        },
    }


@router.post(
    "/login",
    response_model=dict,
    summary="Login with email and password",
)
async def login(
    req: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    # If logging in with demo account, automatically spawn an isolated 30-min demo session
    if req.email.strip().lower() == "demo@gmail.com":
        from app.services import demo_session_service
        return await demo_session_service.create_demo_session(db)

    stmt = (
        select(User)
        .where(User.email == req.email)
        .options(selectinload(User.subscription), selectinload(User.domains))
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password.",
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return {
        "status": 200,
        "message": "Signed in successfully!",
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        },
        "user": {
            "id": str(user.id),
            "fullname": user.fullname,
            "email": user.email,
            "type": user.type,
            "subscription": {
                "plan": user.subscription.plan if user.subscription else Plans.STANDARD,
                "credits": user.subscription.credits if user.subscription else 0,
            },
            "domains": [
                {"id": str(d.id), "name": d.name, "icon": d.icon}
                for d in user.domains
            ],
        },
    }


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Get a new access token using refresh token",
)
async def refresh_token(
    req: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user_id_str = payload.get("sub")
    try:
        user_uuid = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in refresh token",
        )

    user = await db.scalar(select(User).where(User.id == user_uuid))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.type == "demo" and user.email.startswith("demo_"):
        from datetime import datetime, timedelta, timezone
        if user.created_at and datetime.now(timezone.utc) > (user.created_at + timedelta(minutes=30)):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Phiên trải nghiệm demo 30 phút đã kết thúc. Vui lòng đăng ký tài khoản chính thức.",
            )

    new_access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile & subscription",
)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime, timedelta, timezone
    is_demo = current_user.type == "demo" or current_user.email == "demo@gmail.com"
    demo_expires_at = None
    if is_demo:
        now_utc = datetime.now(timezone.utc)
        if current_user.created_at and (now_utc - current_user.created_at) < timedelta(minutes=30):
            demo_expires_at = current_user.created_at + timedelta(minutes=30)
        else:
            demo_expires_at = now_utc + timedelta(minutes=30)

    user_resp = UserResponse.model_validate(current_user)
    user_resp.is_demo = is_demo
    user_resp.demo_expires_at = demo_expires_at
    return user_resp


@router.post(
    "/change-password",
    summary="Change user password",
)
async def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password.",
        )

    current_user.hashed_password = get_password_hash(req.new_password)
    await db.commit()

    return {
        "status": 200,
        "message": "Password changed successfully!",
    }


@router.post(
    "/demo-session",
    response_model=dict,
    summary="Create an isolated sandbox demo session",
)
async def create_demo_session_endpoint(
    db: AsyncSession = Depends(get_db),
):
    """
    Creates an isolated demo session cloned from the master template.
    Returns access tokens and user profile immediately without requiring credentials.
    """
    from app.services import demo_session_service
    return await demo_session_service.create_demo_session(db)


@router.post(
    "/demo-session/terminate",
    response_model=dict,
    summary="Terminate current demo session and wipe all ephemeral data",
)
async def terminate_demo_session_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Terminates the current ephemeral demo session, deleting its cloned Pinecone namespace
    and all transient Postgres records.
    """
    from app.services import demo_session_service
    return await demo_session_service.terminate_demo_session(current_user, db)
