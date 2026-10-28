import math
import uuid
from typing import Any, Dict, List, Optional, Union
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.product import (
    ProductCreateRequest,
    ProductListResponse,
    ProductResponse,
    ProductUpdateRequest,
)
from app.services import product_service

router = APIRouter()


@router.get(
    "/{domain_id}/products",
    response_model=Union[ProductListResponse, List[ProductResponse]],
    summary="Get domain products",
    description="Retrieve products and services configured for a specific domain with optional search and pagination.",
)
async def list_domain_products(
    domain_id: uuid.UUID,
    search: Optional[str] = Query(
        None, description="Search term to filter products by name"
    ),
    page: Optional[int] = Query(
        None, ge=1, description="Page number (starting from 1)"
    ),
    page_size: Optional[int] = Query(
        None, ge=1, le=100, description="Items per page (1-100)"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Union[ProductListResponse, List[ProductResponse]]:
    """Retrieve products for a domain, with optional search filter and pagination."""
    products, total = await product_service.get_products_by_domain(
        db, domain_id, current_user, search=search, page=page, page_size=page_size
    )
    product_items = [ProductResponse.model_validate(p) for p in products]

    if page is not None or page_size is not None:
        p = page or 1
        ps = page_size or 10
        total_pages = math.ceil(total / ps) if total > 0 else 1
        return ProductListResponse(
            products=product_items,
            total=total,
            page=p,
            page_size=ps,
            total_pages=total_pages,
        )

    return product_items



@router.post(
    "/{domain_id}/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create product",
    description="Add a new product or service to a domain.",
)
async def create_domain_product(
    domain_id: uuid.UUID,
    product_in: ProductCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Create a new product for a domain."""
    product = await product_service.create_product(
        db, domain_id, current_user, product_in
    )
    return ProductResponse.model_validate(product)


@router.get(
    "/{domain_id}/products/{product_id}",
    response_model=ProductResponse,
    summary="Get product detail",
    description="Retrieve details of a single product by ID.",
)
async def get_domain_product(
    domain_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Get single product details."""
    product = await product_service.get_product_by_id(
        db, domain_id, product_id, current_user
    )
    return ProductResponse.model_validate(product)


@router.put(
    "/{domain_id}/products/{product_id}",
    response_model=ProductResponse,
    summary="Update product",
    description="Update an existing product's name, price, or image.",
)
async def update_domain_product(
    domain_id: uuid.UUID,
    product_id: uuid.UUID,
    product_in: ProductUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Update an existing product."""
    product = await product_service.update_product(
        db, domain_id, product_id, current_user, product_in
    )
    return ProductResponse.model_validate(product)


@router.delete(
    "/{domain_id}/products/{product_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete product",
    description="Delete a product from a domain.",
)
async def delete_domain_product(
    domain_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a product from a domain."""
    await product_service.delete_product(
        db, domain_id, product_id, current_user
    )
    return {
        "status": "success",
        "message": "Product deleted successfully",
        "product_id": product_id,
    }
