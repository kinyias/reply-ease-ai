import uuid
from typing import List
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreateRequest, ProductUpdateRequest
from app.services.domain_service import get_domain_by_id


async def get_products_by_domain(
    db: AsyncSession, domain_id: uuid.UUID, user: User
) -> List[Product]:
    """Retrieve all products belonging to a domain owned by user."""
    # Ensure domain ownership
    await get_domain_by_id(db, domain_id, user)

    stmt = (
        select(Product)
        .where(Product.domain_id == domain_id)
        .order_by(Product.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_product_by_id(
    db: AsyncSession, domain_id: uuid.UUID, product_id: uuid.UUID, user: User
) -> Product:
    """Retrieve a single product by ID for a domain owned by user."""
    await get_domain_by_id(db, domain_id, user)

    stmt = select(Product).where(
        Product.id == product_id, Product.domain_id == domain_id
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found in this domain",
        )
    return product


async def create_product(
    db: AsyncSession,
    domain_id: uuid.UUID,
    user: User,
    product_in: ProductCreateRequest,
) -> Product:
    """Create a new product under a domain."""
    await get_domain_by_id(db, domain_id, user)

    product = Product(
        id=uuid.uuid4(),
        name=product_in.name.strip(),
        price=product_in.price,
        image=product_in.image.strip(),
        domain_id=domain_id,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def update_product(
    db: AsyncSession,
    domain_id: uuid.UUID,
    product_id: uuid.UUID,
    user: User,
    product_in: ProductUpdateRequest,
) -> Product:
    """Update an existing product."""
    product = await get_product_by_id(db, domain_id, product_id, user)

    if product_in.name is not None:
        product.name = product_in.name.strip()
    if product_in.price is not None:
        product.price = product_in.price
    if product_in.image is not None:
        product.image = product_in.image.strip()

    await db.commit()
    await db.refresh(product)
    return product


async def delete_product(
    db: AsyncSession, domain_id: uuid.UUID, product_id: uuid.UUID, user: User
) -> bool:
    """Delete a product from a domain."""
    product = await get_product_by_id(db, domain_id, product_id, user)
    await db.delete(product)
    await db.commit()
    return True
