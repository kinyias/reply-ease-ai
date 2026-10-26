import asyncio
import sys
import uuid
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.billing import Billings
from app.models.chatbot import ChatBot
from app.models.domain import Domain
from app.models.enums import Plans
from app.models.user import User
from app.schemas.domain import (
    DomainCreateRequest,
    DomainQuotaResponse,
    DomainResponse,
)
from app.services.domain_service import (
    PLAN_DOMAIN_LIMITS,
    check_domain_quota,
    create_domain,
    delete_domain,
    get_domain_quota_status,
    get_user_domains,
)


async def test_schemas():
    print("\n--- 1. Testing Domain Pydantic Schemas ---")

    # Normal clean domain
    req1 = DomainCreateRequest(name="my-ecommerce.com", icon="https://cdn.example.com/icon.png")
    assert req1.name == "my-ecommerce.com", f"Expected 'my-ecommerce.com', got {req1.name}"
    print("  [x] DomainCreateRequest basic format OK")

    # Strip https:// and trailing paths
    req2 = DomainCreateRequest(name="https://STORE.VN/checkout/test", icon="https://cdn.example.com/icon.png")
    assert req2.name == "store.vn", f"Expected 'store.vn', got {req2.name}"
    print("  [x] DomainCreateRequest stripping http/https and paths OK:", req2.name)

    # Empty validation error
    try:
        DomainCreateRequest(name="  ", icon="icon.png")
        print("  [!] Failed: empty domain should have raised ValidationError")
        sys.exit(1)
    except ValidationError:
        print("  [x] DomainCreateRequest rejection of empty input OK")


async def test_service_with_db():
    print("\n--- 2. Testing Database Quota & Domain Service ---")

    test_email = f"test_domain_quota_{uuid.uuid4().hex[:8]}@example.com"

    async with AsyncSessionLocal() as db:
        # Create test user
        user = User(
            id=uuid.uuid4(),
            fullname="Quota Test User",
            email=test_email,
            hashed_password=get_password_hash("password123"),
            type="owner",
        )
        db.add(user)

        # Create billing with STANDARD plan (limit 1 domain)
        billing = Billings(
            id=uuid.uuid4(),
            plan=Plans.STANDARD,
            credits=10,
            user_id=user.id,
        )
        db.add(billing)
        await db.commit()

        # Reload user with subscription
        stmt = (
            select(User)
            .where(User.id == user.id)
            .options(selectinload(User.subscription), selectinload(User.domains))
        )
        res = await db.execute(stmt)
        user = res.scalar_one()

        print(f"  [x] Created test user {user.email} on plan {user.subscription.plan}")

        # Test initial quota
        quota = await get_domain_quota_status(db, user)
        assert quota.plan == Plans.STANDARD
        assert quota.max_domains == 1
        assert quota.used_domains == 0
        assert quota.remaining_domains == 1
        assert quota.can_create_domain is True
        print("  [x] Initial quota check passed: 0/1 domains used")

        # Create 1st domain (Allowed)
        domain1_req = DomainCreateRequest(name="alpha-shop.com", icon="https://icon.test/alpha.png")
        domain1 = await create_domain(db, user, domain1_req)
        assert domain1.name == "alpha-shop.com"
        assert domain1.chat_bot is not None
        assert domain1.chat_bot.welcome_message == "Hey there, have a question? Text us here"
        print("  [x] Domain 1 created successfully with auto-generated ChatBot:", domain1.name)

        # Check quota after 1st domain (Full for Standard)
        quota_after1 = await get_domain_quota_status(db, user)
        assert quota_after1.used_domains == 1
        assert quota_after1.remaining_domains == 0
        assert quota_after1.can_create_domain is False
        print("  [x] Quota check after 1st domain: 1/1 domains used (can_create_domain=False)")

        # Try to create 2nd domain on STANDARD plan (Must fail with 400 quota limit)
        domain2_req = DomainCreateRequest(name="beta-shop.com", icon="https://icon.test/beta.png")
        try:
            await create_domain(db, user, domain2_req)
            print("  [!] Failed: 2nd domain on STANDARD plan should have been rejected")
            sys.exit(1)
        except HTTPException as e:
            assert e.status_code == 400
            assert "maximum number of domains" in e.detail.lower()
            print(f"  [x] Quota limit enforcement OK: {e.detail}")

        # Upgrade user to PRO plan (limit 5 domains)
        billing.plan = Plans.PRO
        billing.credits = 50
        await db.commit()
        await db.refresh(user)

        # Reload user with subscription
        res = await db.execute(stmt)
        user = res.scalar_one()

        quota_pro = await get_domain_quota_status(db, user)
        assert quota_pro.plan == Plans.PRO
        assert quota_pro.max_domains == 5
        assert quota_pro.used_domains == 1
        assert quota_pro.remaining_domains == 4
        assert quota_pro.can_create_domain is True
        print("  [x] Upgraded to PRO plan: 1/5 used, remaining: 4")

        # Test duplicate domain name check
        dup_req = DomainCreateRequest(name="ALPHA-SHOP.com", icon="https://icon.test/dup.png")
        try:
            await create_domain(db, user, dup_req)
            print("  [!] Failed: Duplicate domain name should have been rejected")
            sys.exit(1)
        except HTTPException as e:
            assert e.status_code == 400
            assert "already exists" in e.detail.lower()
            print(f"  [x] Duplicate domain name rejection OK: {e.detail}")

        # Create 2nd domain on PRO plan (Allowed)
        domain2 = await create_domain(db, user, domain2_req)
        assert domain2.name == "beta-shop.com"
        print("  [x] Domain 2 created successfully on PRO plan:", domain2.name)

        # List user domains
        domains = await get_user_domains(db, user)
        assert len(domains) == 2
        print(f"  [x] get_user_domains returned {len(domains)} domains")

        # Test DomainResponse model serialization
        resp_model = DomainResponse.model_validate(domains[0])
        assert resp_model.name in ["alpha-shop.com", "beta-shop.com"]
        assert resp_model.chat_bot is not None
        print("  [x] DomainResponse Pydantic serialization OK")

        # Clean up test data
        print("  Cleaning up test entities...")
        await db.delete(domain1)
        await db.delete(domain2)
        await db.delete(billing)
        await db.delete(user)
        await db.commit()
        print("  [x] Cleanup complete")


async def main():
    await test_schemas()
    await test_service_with_db()
    print("\nALL STEP 3.1 TESTS PASSED SUCCESSFULLY! 🚀")


if __name__ == "__main__":
    asyncio.run(main())
