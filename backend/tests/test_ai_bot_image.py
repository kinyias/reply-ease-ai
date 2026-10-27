import uuid
import pytest
from unittest.mock import MagicMock

from app.models.domain import Domain
from app.models.chatbot import ChatBot
from app.models.customer import Customer
from app.models.product import Product
from app.services.ai_bot_service import build_system_prompt, simulate_ai_response


def test_build_system_prompt_includes_image_rule():
    domain = Domain(
        id=uuid.uuid4(),
        name="Test Shop",
        chat_bot=ChatBot(id=uuid.uuid4(), welcome_message="Xin chào!"),
    )
    customer = Customer(id=uuid.uuid4(), email="customer@example.com")
    prompt = build_system_prompt(
        domain=domain,
        customer=customer,
        unanswered_questions=[],
        knowledge_context="DANH MỤC SẢN PHẨM & DỊCH VỤ CỦA CHÚNG TÔI:\n- Áo thun Polo: 250,000 VND (Link ảnh: https://res.cloudinary.com/test/polo.jpg)",
        customer_id_str=str(customer.id),
    )

    # Must contain Rule 5 with <Image>
    assert "QUY TẮC HIỂN THỊ HÌNH ẢNH SẢN PHẨM (BẮT BUỘC DÙNG THẺ <Image>)" in prompt
    assert "<Image>đường_dẫn_ảnh</Image>" in prompt
    assert "BẮT BUỘC sử dụng chính xác thẻ `<Image>...</Image>`" in prompt


def test_simulate_ai_response_product_with_image():
    domain = Domain(id=uuid.uuid4(), name="Test Store")
    customer = Customer(id=uuid.uuid4(), email="buyer@gmail.com")
    sample_product = Product(
        id=uuid.uuid4(),
        name="Giày Thể Thao Sneaker",
        price=550000,
        image="https://res.cloudinary.com/demo/image/upload/sneaker.jpg",
    )

    response = simulate_ai_response(
        domain=domain,
        customer=customer,
        message="Tôi muốn tư vấn về sản phẩm Giày Thể Thao Sneaker",
        unanswered_questions=[],
        products=[sample_product],
    )

    # Should include product name, price, and <Image> tag with exact image url
    assert sample_product.name in response
    assert "550,000 VND" in response
    assert f"<Image>{sample_product.image}</Image>" in response


def test_simulate_ai_response_product_without_image():
    domain = Domain(id=uuid.uuid4(), name="Test Store")
    customer = Customer(id=uuid.uuid4(), email="buyer@gmail.com")
    sample_product = Product(
        id=uuid.uuid4(),
        name="Khóa học online",
        price=1000000,
        image="",  # No image
    )

    response = simulate_ai_response(
        domain=domain,
        customer=customer,
        message="Báo giá cho tôi khóa học online",
        unanswered_questions=[],
        products=[sample_product],
    )

    assert sample_product.name in response
    assert "<Image>" not in response
