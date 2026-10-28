import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.websocket_manager import websocket_manager
from app.models.billing import Billings
from app.models.chat_message import ChatMessage
from app.models.chatbot import ChatBot
from app.models.chatroom import ChatRoom
from app.models.customer import Customer
from app.models.customer_response import CustomerResponses
from app.models.domain import Domain
from app.models.enums import Plans, Role
from app.models.filter_question import FilterQuestions
from app.models.helpdesk import HelpDesk
from app.models.knowledge_document import KnowledgeChunk
from app.models.product import Product
from app.services import vector_service
from app.services.email_service import send_live_chat_alert
from app.services.gemini_service import generate_content_with_fallback

logger = logging.getLogger(__name__)

# Regular expression to extract email addresses
EMAIL_REGEX = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
)

# Regular expressions for Portal links
PORTAL_LINK_REGEX = re.compile(r"/portal/[a-zA-Z0-9_-]+/(?:appointment|payment)/[a-zA-Z0-9_-]+")


def extract_email(text: str) -> Optional[str]:
    """Extract the first valid email address from text using regex."""
    if not text:
        return None
    match = EMAIL_REGEX.search(text)
    return match.group(0).lower() if match else None


async def get_or_create_customer_and_room(
    db: AsyncSession,
    domain: Domain,
    email: Optional[str] = None,
    chatroom_id: Optional[uuid.UUID] = None,
) -> Tuple[Customer, ChatRoom]:
    """
    Find or create Customer and ChatRoom.
    If an email is detected, ensures Customer is created, filter questions are cloned
    into CustomerResponses, and a ChatRoom is linked.
    """
    customer: Optional[Customer] = None
    chatroom: Optional[ChatRoom] = None

    # 1. If chatroom_id is provided, try loading it
    if chatroom_id:
        room_stmt = (
            select(ChatRoom)
            .options(
                selectinload(ChatRoom.customer).selectinload(Customer.questions),
                selectinload(ChatRoom.messages),
            )
            .where(ChatRoom.id == chatroom_id)
        )
        room_res = await db.execute(room_stmt)
        chatroom = room_res.scalar_one_or_none()
        if chatroom and chatroom.customer:
            customer = chatroom.customer

    clean_email = email.strip().lower() if email else None

    # 2. If email is provided, find or create Customer
    if clean_email:
        cust_stmt = (
            select(Customer)
            .options(
                selectinload(Customer.questions),
                selectinload(Customer.chat_rooms),
            )
            .where(Customer.email == clean_email, Customer.domain_id == domain.id)
        )
        cust_res = await db.execute(cust_stmt)
        existing_cust = cust_res.scalar_one_or_none()

        if existing_cust:
            customer = existing_cust
            if chatroom and chatroom.customer_id != customer.id:
                chatroom.customer_id = customer.id
        elif customer:
            customer.email = clean_email
        else:
            # Create new customer
            customer = Customer(
                id=uuid.uuid4(),
                email=clean_email,
                domain_id=domain.id,
            )
            db.add(customer)
            await db.flush()

    # 3. If customer is still None (anonymous visitor), create guest customer
    if not customer:
        customer = Customer(
            id=uuid.uuid4(),
            email=None,
            domain_id=domain.id,
        )
        db.add(customer)
        await db.flush()

    # 4. Clone filter questions into CustomerResponses if not already cloned
    existing_res = await db.execute(
        select(CustomerResponses).where(CustomerResponses.customer_id == customer.id)
    )
    existing_q_texts = {q.question.strip() for q in existing_res.scalars().all()}

    fq_stmt = (
        select(FilterQuestions)
        .where(FilterQuestions.domain_id == domain.id)
        .order_by(FilterQuestions.created_at.asc())
    )
    fq_res = await db.execute(fq_stmt)
    domain_fqs = fq_res.scalars().all()

    for fq in domain_fqs:
        if fq.question.strip() not in existing_q_texts:
            new_resp = CustomerResponses(
                id=uuid.uuid4(),
                question=fq.question.strip(),
                answered=None,
                customer_id=customer.id,
            )
            db.add(new_resp)
    await db.flush()

    # 5. Ensure customer has a ChatRoom
    if not chatroom:
        room_res = await db.execute(
            select(ChatRoom).where(ChatRoom.customer_id == customer.id).order_by(ChatRoom.created_at.desc()).limit(1)
        )
        existing_room = room_res.scalar_one_or_none()
        if existing_room:
            chatroom = existing_room
        else:
            chatroom = ChatRoom(
                id=uuid.uuid4(),
                customer_id=customer.id,
                live=False,
                mailed=False,
            )
            db.add(chatroom)
            await db.flush()
    elif not chatroom.customer_id:
        # Associate existing room with customer
        chatroom.customer_id = customer.id
        await db.flush()

    return customer, chatroom


async def check_and_update_filter_answer(
    db: AsyncSession,
    customer: Optional[Customer],
    chat_history: List[Dict[str, str]],
    new_message: str,
) -> bool:
    """
    If the previous assistant message contained the (complete) keyword,
    the user's new message is considered the answer to the first unanswered
    filter question.
    """
    if not customer or not chat_history:
        return False

    # Check the last assistant message
    last_assistant_msg = None
    for entry in reversed(chat_history):
        if entry.get("role") in ["assistant", "bot"]:
            last_assistant_msg = entry.get("content") or entry.get("message") or ""
            break

    if not last_assistant_msg or "(complete)" not in last_assistant_msg.lower():
        return False

    # Find first unanswered response
    stmt = (
        select(CustomerResponses)
        .where(
            CustomerResponses.customer_id == customer.id,
            CustomerResponses.answered.is_(None),
        )
        .order_by(CustomerResponses.created_at.asc())
    )
    result = await db.execute(stmt)
    unanswered_resp = result.scalars().first()

    if unanswered_resp:
        unanswered_resp.answered = new_message.strip()
        await db.flush()
        logger.info(
            f"Updated answer for filter question '{unanswered_resp.question}' for customer {customer.email}"
        )
        return True

    return False


async def build_knowledge_context(
    db: AsyncSession,
    domain: Domain,
    query: str,
) -> Tuple[str, List[Product]]:
    """
    Assemble RAG context from Pinecone and fallback to local DB HelpDesk & Products.
    Returns (knowledge_context_str, products_list).
    """
    context_chunks: List[str] = []

    # 1. Query Pinecone vector DB
    pinecone_found = False
    try:
        pinecone_matches = await vector_service.query_knowledge(
            domain_id=domain.id,
            query=query,
            top_k=5,
        )
        if pinecone_matches:
            rag_snippets = [f"- {m['text']}" for m in pinecone_matches if m.get("text")]
            if rag_snippets:
                context_chunks.append("THÔNG TIN TRUY XUẤT TỪ CƠ SỞ TRI THỨC (RAG):\n" + "\n".join(rag_snippets))
                pinecone_found = True
    except Exception as exc:
        logger.warning(f"Error querying vector service: {exc}")

    # Fallback/supplementary: query database KnowledgeChunks if vector DB returned few matches
    if not pinecone_found:
        try:
            words = [w.strip() for w in re.split(r"[\s\.,\?!;:]+", query) if len(w.strip()) >= 3]
            doc_chunks: List[KnowledgeChunk] = []
            if words:
                from sqlalchemy import or_
                conditions = [KnowledgeChunk.content.ilike(f"%{w}%") for w in words[:4]]
                kw_stmt = select(KnowledgeChunk).where(
                    KnowledgeChunk.domain_id == domain.id,
                    or_(*conditions),
                ).limit(5)
                kw_res = await db.execute(kw_stmt)
                doc_chunks = list(kw_res.scalars().all())

            if not doc_chunks:
                recent_stmt = select(KnowledgeChunk).where(
                    KnowledgeChunk.domain_id == domain.id
                ).order_by(KnowledgeChunk.created_at.desc()).limit(3)
                recent_res = await db.execute(recent_stmt)
                doc_chunks = list(recent_res.scalars().all())

            if doc_chunks:
                doc_snippets = [f"- {c.content}" for c in doc_chunks]
                context_chunks.append("THÔNG TIN TRUY XUẤT TỪ TÀI LIỆU HUẤN LUYỆN (PDF/EXCEL/TXT):\n" + "\n".join(doc_snippets))
        except Exception as exc:
            logger.warning(f"Error querying DB knowledge chunks: {exc}")

    # 2. Retrieve domain HelpDesk FAQs
    hd_stmt = select(HelpDesk).where(HelpDesk.domain_id == domain.id).limit(10)
    hd_res = await db.execute(hd_stmt)
    faqs = hd_res.scalars().all()
    if faqs:
        faq_texts = [f"Q: {f.question}\nA: {f.answer}" for f in faqs]
        context_chunks.append("CÂU HỎI THƯỜNG GẶP (HELPDESK FAQ):\n" + "\n\n".join(faq_texts))

    # 3. Retrieve domain Products
    prod_stmt = select(Product).where(Product.domain_id == domain.id).limit(10)
    prod_res = await db.execute(prod_stmt)
    products = list(prod_res.scalars().all())
    if products:
        prod_texts = [
            f"- {p.name}: {p.price:,} VND" + (f" (Link ảnh: {p.image})" if p.image else " (Không có ảnh)")
            for p in products
        ]
        context_chunks.append("DANH MỤC SẢN PHẨM & DỊCH VỤ CỦA CHÚNG TÔI:\n" + "\n".join(prod_texts))

    return "\n\n".join(context_chunks), products


def build_system_prompt(
    domain: Domain,
    customer: Optional[Customer],
    unanswered_questions: List[str],
    knowledge_context: str,
    customer_id_str: str,
) -> str:
    """
    Construct the master System Prompt for Gemini 1.5 Flash.
    """
    bot_welcome = (
        domain.chat_bot.welcome_message
        if domain.chat_bot and domain.chat_bot.welcome_message
        else "Xin chào! Tôi có thể giúp gì cho bạn?"
    )

    unanswered_block = (
        "\n".join([f"- {q}" for q in unanswered_questions])
        if unanswered_questions
        else "Không còn câu hỏi sàng lọc nào chưa trả lời."
    )

    has_email = customer is not None and bool(customer.email)

    prompt = f"""Bạn là Trợ lý Bán Hàng & Chăm Sóc Khách Hàng AI thông minh, đại diện chính thức cho website/doanh nghiệp: "{domain.name}".

MỤC TIÊU CỐT LÕI:
- Hỗ trợ và tư vấn nhiệt tình, thân thiện, trung thực, chuyên nghiệp, súc tích.
- Giải đáp thắc mắc dựa trên cơ sở tri thức đã cung cấp. Tuyệt đối không bịa đặt thông tin không có trong tài liệu.
- Khéo léo thu thập thông tin khách hàng tiềm năng, hướng dẫn đặt lịch hẹn hoặc thanh toán mua hàng.
- PHỤC VỤ ĐA NGÔN NGỮ (MULTILINGUAL): Có khả năng giao tiếp và phản hồi trôi chảy bằng BẤT KỲ NGÔN NGỮ NÀO mà khách hàng sử dụng hoặc yêu cầu.

THÔNG TIN TRÍ THỨC & DỮ LIỆU DOANH NGHIỆP:
{knowledge_context if knowledge_context.strip() else "Doanh nghiệp hiện chưa có thêm tài liệu mở rộng."}

TRẠNG THÁI KHÁCH HÀNG HIỆN TẠI:
- Khách đã cung cấp Email chưa: {"ĐÃ CÓ (" + customer.email + ")" if has_email else "CHƯA CÓ EMAIL"}
- Danh sách câu hỏi sàng lọc lead cần hỏi (Filter Questions):
{unanswered_block}

QUY TẮC BẮT BUỘC (TUÂN THỦ 100%):

1. QUY TẮC NGÔN NGỮ (ĐA NGÔN NGỮ TOÀN DIỆN - BẮT BUỘC):
- TỰ ĐỘNG PHÁT HIỆN & PHẢN HỒI THEO NGÔN NGỮ CỦA KHÁCH:
  Khách hàng nhắn tin bằng bất kỳ ngôn ngữ nào (tiếng Việt, tiếng Anh, tiếng Trung, tiếng Nhật, tiếng Hàn, tiếng Pháp, tiếng Đức, tiếng Tây Ban Nha, tiếng Nga,...), bạn BẮT BUỘC phải phản hồi lại bằng CHÍNH XÁC ngôn ngữ đó. Văn phong phải tự nhiên, đúng ngữ pháp, lịch sự và đúng chuẩn mực bản xứ của ngôn ngữ đó.
- LINH HOẠT CHUYỂN ĐỔI:
  Nếu khách hàng chuyển đổi sang ngôn ngữ khác hoặc yêu cầu bạn trả lời bằng một ngôn ngữ cụ thể, hãy ngay lập tức phản hồi bằng ngôn ngữ được yêu cầu.
- CHUYỂN TẢI THÔNG TIN TRI THỨC ĐA NGÔN NGỮ:
  Dữ liệu tri thức doanh nghiệp, danh mục sản phẩm và câu hỏi sàng lọc có thể đang được viết bằng tiếng Việt hoặc ngôn ngữ khác. Khi giao tiếp với khách hàng nói ngôn ngữ khác, bạn hãy tự động dịch và truyền đạt nội dung một cách tự nhiên, chính xác sang ngôn ngữ của khách. Giữ nguyên độ chính xác của giá trị số, mã sản phẩm, giá tiền tệ và tên thương hiệu.
- BẢO TOÀN NGUYÊN VẸN CÁC TỪ KHÓA VÀ THẺ KỸ THUẬT:
  + Từ khóa `(complete)` và `(realtime)` BẮT BUỘC giữ nguyên ký tự ASCII tiếng Anh trong ngoặc đơn ở cuối câu trả lời khi kích hoạt quy tắc tương ứng. TUYỆT ĐỐI KHÔNG DỊCH hai từ khóa này sang ngôn ngữ khác.
  + Thẻ hình ảnh `<Image>URL</Image>` BẮT BUỘC giữ nguyên cú pháp thẻ `<Image>...</Image>` (chữ I viết hoa), TUYỆT ĐỐI KHÔNG DỊCH tên thẻ.
  + Đường dẫn Portal (`/portal/...`) BẮT BUỘC giữ nguyên chính xác cấu trúc đường link URL, không dịch hay thay đổi link.

2. QUY TẮC XIN EMAIL:
{"- Khách hàng đã cung cấp email, bạn KHÔNG cần hỏi lại email nữa." if has_email else "- Khách hàng CHƯA cung cấp email. Hãy trả lời ngắn gọn thắc mắc hiện tại của khách, đồng thời khéo léo và lịch sự xin địa chỉ email của khách bằng chính ngôn ngữ của họ (Ví dụ tiếng Việt: 'Để em gửi bảng báo giá chi tiết và ưu đãi riêng, anh/chị cho em xin địa chỉ email nhé!'; Tiếng Anh: 'To send you detailed pricing and exclusive offers, could you please provide your email address?') để tiếp tục tư vấn chuyên sâu."}

3. QUY TẮC CÂU HỎI SÀNG LỌC VÀ TỪ KHÓA `(complete)`:
- Khi khách hàng đã cung cấp email VÀ còn câu hỏi sàng lọc chưa trả lời ở trên:
  Hãy chọn câu hỏi sàng lọc tiếp theo từ danh sách, dịch câu hỏi đó sang ngôn ngữ mà khách hàng đang sử dụng và hỏi khách một cách tự nhiên trong cuộc trò chuyện.
  BẮT BUỘC: Khi bạn hỏi câu hỏi từ danh sách sàng lọc này, hãy gắn chính xác từ khóa `(complete)` ở cuối câu trả lời của bạn.
  Ví dụ tiếng Việt: "Anh/chị đang có ngân sách dự kiến khoảng bao nhiêu cho dự án này ạ? (complete)"
  Ví dụ tiếng Anh: "What is your estimated budget for this project? (complete)"

4. QUY TẮC YÊU CẦU NGƯỜI THẬT VÀ TỪ KHÓA `(realtime)`:
- Nếu khách hàng bày tỏ sự thất vọng, tức giận, quấy rối, hỏi những nội dung không thuộc phạm vi chuyên môn/sản phẩm của {domain.name}, HOẶC khách hàng yêu cầu trực tiếp nói chuyện với nhân viên tư vấn/người thật/quản lý:
  Hãy phản hồi thật lịch sự bằng ngôn ngữ của khách hàng, thông báo bạn đang chuyển tiếp cuộc trò chuyện cho nhân viên hỗ trợ trực tiếp.
  BẮT BUỘC: Gắn chính xác từ khóa `(realtime)` ở cuối câu trả lời của bạn để hệ thống tự động kích hoạt chế độ Live Chat và gửi thông báo khẩn cấp tới chủ website.
  Ví dụ tiếng Việt: "Dạ em hiểu rồi ạ! Em xin phép chuyển tiếp cuộc trò chuyện sang nhân viên hỗ trợ trực tiếp. Chuyên viên sẽ vào hỗ trợ anh/chị ngay nhé ạ! (realtime)"
  Ví dụ tiếng Anh: "I understand! I am transferring this chat to a live support specialist right now. Someone will assist you shortly! (realtime)"

5. QUY TẮC ĐƯỜNG DẪN PORTAL:
- Khi khách hàng muốn ĐẶT LỊCH HẸN / TƯ VẤN TRỰC TIẾP:
  Cung cấp đường dẫn: /portal/{domain.id}/appointment/{customer_id_str}
  (Ví dụ tiếng Việt: "Anh/chị có thể đặt lịch hẹn tư vấn thuận tiện tại: /portal/{domain.id}/appointment/{customer_id_str}")
  (Ví dụ tiếng Anh: "You can conveniently schedule a consultation here: /portal/{domain.id}/appointment/{customer_id_str}")
- Khi khách hàng muốn MUA HÀNG / THANH TOÁN SẢN PHẨM:
  Cung cấp đường dẫn: /portal/{domain.id}/payment/{customer_id_str}
  (Ví dụ tiếng Việt: "Anh/chị có thể xem giỏ hàng và thanh toán VietQR tại: /portal/{domain.id}/payment/{customer_id_str}")
  (Ví dụ tiếng Anh: "You can view your order and complete payment here: /portal/{domain.id}/payment/{customer_id_str}")

6. QUY TẮC HIỂN THỊ HÌNH ẢNH SẢN PHẨM (BẮT BUỘC DÙNG THẺ <Image>):
- Khi phản hồi, giới thiệu hoặc tư vấn về thông tin sản phẩm: NẾU sản phẩm đó có thông tin link ảnh (được ghi 'Link ảnh: ...' trong DANH MỤC SẢN PHẨM), bạn BẮT BUỘC phải đặt link ảnh vào bên trong thẻ `<Image>đường_dẫn_ảnh</Image>`.
  Ví dụ chuẩn:
  "Dạ bên em có sản phẩm Áo Hoodie Unisex với giá ưu đãi là 350,000 VND ạ:
  <Image>https://res.cloudinary.com/.../hoodie.jpg</Image>
  Anh/chị có cần em tư vấn thêm chi tiết không ạ?"
  (Hoặc tiếng Anh:
  "We have Unisex Hoodie available for 350,000 VND:
  <Image>https://res.cloudinary.com/.../hoodie.jpg</Image>
  Would you like more details or assistance?")
- BẮT BUỘC sử dụng chính xác thẻ `<Image>...</Image>` (chữ I viết hoa). KHÔNG dùng cú pháp markdown ảnh ![alt](url) và KHÔNG để URL trần ngoài thẻ.
- Chỉ đặt DUY NHẤT đường link URL bên trong cặp thẻ `<Image>...</Image>`, không chèn thêm bất kỳ chữ hay khoảng trắng thừa nào trong thẻ.
- Nếu sản phẩm không có link ảnh hoặc ghi 'Không có ảnh', tuyệt đối không tự bịa đặt link ảnh hoặc thêm thẻ <Image>.

HÃY LUÔN PHẢN HỒI BẰNG CHÍNH NGÔN NGỮ MÀ KHÁCH HÀNG ĐANG SỬ DỤNG HOẶC YÊU CẦU, VỚI VĂN PHONG TỰ NHIÊN, LỊCH SỰ, RÕ RÀNG VÀ CHUYÊN NGHIỆP!"""

    return prompt


def simulate_ai_response(
    domain: Domain,
    customer: Optional[Customer],
    message: str,
    unanswered_questions: List[str],
    products: Optional[List[Product]] = None,
) -> str:
    """
    Intelligent offline/fallback AI response generator adhering strictly to the state machine.
    Supports English & Vietnamese fallback.
    Used if all Gemini models are exhausted or API key is not configured.
    """
    msg_lower = message.lower()
    has_email = customer is not None and bool(customer.email)
    cust_id = str(customer.id) if customer else "anonymous"

    # Detect English input
    english_cues = [
        "hello", "hi", "hey", "price", "product", "buy", "purchase", "book", "appointment",
        "help", "order", "human", "agent", "support", "email", "cost", "how much", "what is",
        "can you", "please", "thanks", "thank you", "representative", "manager"
    ]
    vietnamese_cues = [
        "xin chào", "chào", "giá", "báo giá", "sản phẩm", "đặt lịch", "tư vấn", "bao nhiêu",
        "mua", "em ơi", "anh", "chị", "ơi", "dạ", "cảm ơn"
    ]
    is_english = any(k in msg_lower for k in english_cues) and not any(k in msg_lower for k in vietnamese_cues)

    if is_english:
        # 1. Escalation / human support
        if any(k in msg_lower for k in ["human", "agent", "person", "representative", "manager", "complaint", "talk to somebody", "talk to someone"]):
            return (
                f"I understand! I'm transferring this chat to a live support specialist right now. "
                f"A team member from {domain.name} will respond shortly! (realtime)"
            )

        # 2. Appointment booking request
        if any(k in msg_lower for k in ["appointment", "booking", "book", "schedule", "consultation", "meeting"]):
            link = f"/portal/{domain.id}/appointment/{cust_id}"
            return (
                f"Wonderful! You can choose the most convenient time for a 1-on-1 consultation here: "
                f"{link} . We look forward to speaking with you!"
            )

        # 3. Product purchasing / payment request
        if any(k in msg_lower for k in ["buy", "payment", "pay", "order", "checkout", "cart", "purchase"]):
            link = f"/portal/{domain.id}/payment/{cust_id}"
            return (
                f"Sure! You can check our products and complete your payment here: "
                f"{link} . Thank you for choosing {domain.name}!"
            )

        # 4. Product inquiry & recommendation with <Image>
        if products and any(k in msg_lower for k in ["product", "price", "cost", "detail", "item", "catalog", "sample"]):
            matched = [p for p in products if p.name.lower() in msg_lower]
            target_prod = matched[0] if matched else products[0]
            img_tag = f"\n<Image>{target_prod.image}</Image>" if target_prod.image else ""

            if not has_email:
                return (
                    f"Here is information about {target_prod.name} at {target_prod.price:,} VND:{img_tag}\n"
                    f"To help me send you detailed specifications and exclusive offers, could you please provide your email address?"
                )
            return (
                f"Here is information about {target_prod.name} at {target_prod.price:,} VND:{img_tag}\n"
                f"Would you like more details or assistance placing an order?"
            )

        # 5. If no email yet
        if not has_email:
            return (
                f"Hello! I am the AI assistant of {domain.name}. I'm glad to help you. "
                f"To help me send you detailed information and exclusive offers, could you please share your email address?"
            )

        # 6. If has email and has unanswered questions
        if unanswered_questions:
            next_q = unanswered_questions[0]
            return (
                f"Thank you for sharing your information! To give you the best consultation, "
                f"{next_q} (complete)"
            )

        # 7. Default friendly response
        return (
            f"{domain.name} is always here to assist you! Feel free to ask about our products, pricing, or schedule a consultation anytime."
        )

    # Vietnamese / Default flow
    # 1. Escalation / human support
    if any(k in msg_lower for k in ["người thật", "nhân viên", "tư vấn viên", "gặp trực tiếp", "khiếu nại", "quản lý", "human", "agent"]):
        return (
            f"Dạ, em hiểu rồi ạ! Em xin phép chuyển tiếp cuộc trò chuyện sang chế độ hỗ trợ trực tiếp. "
            f"Chuyên viên của {domain.name} sẽ vào phản hồi ngay trong ít phút nhé ạ! (realtime)"
        )

    # 2. Appointment booking request
    if any(k in msg_lower for k in ["đặt lịch", "hẹn", "booking", "cuộc hẹn", "lịch tư vấn"]):
        link = f"/portal/{domain.id}/appointment/{cust_id}"
        return (
            f"Dạ tuyệt vời ạ! Anh/chị có thể lựa chọn khung giờ thuận tiện nhất để chuyên viên bên em tư vấn 1-1 tại đây: "
            f"{link} . Bên em rất mong được phục vụ anh/chị!"
        )

    # 3. Product purchasing / payment request
    if any(k in msg_lower for k in ["mua hàng", "thanh toán", "chuyển khoản", "vietqr", "order", "giỏ hàng", "mua ngay"]):
        link = f"/portal/{domain.id}/payment/{cust_id}"
        return (
            f"Dạ vâng! Anh/chị có thể kiểm tra danh mục sản phẩm và quét mã VietQR tự động tại đây nhé: "
            f"{link} . Cảm ơn anh/chị đã tin tưởng {domain.name}!"
        )

    # 4. Product inquiry & recommendation with <Image>
    if products and any(k in msg_lower for k in ["sản phẩm", "báo giá", "giá", "product", "hàng", "chi tiết", "quan tâm", "tư vấn", "mẫu"]):
        matched = [p for p in products if p.name.lower() in msg_lower]
        target_prod = matched[0] if matched else products[0]
        img_tag = f"\n<Image>{target_prod.image}</Image>" if target_prod.image else ""

        if not has_email:
            return (
                f"Dạ, {domain.name} xin gửi anh/chị thông tin sản phẩm {target_prod.name} với mức giá {target_prod.price:,} VND ạ:{img_tag}\n"
                f"Để em tiện gửi thêm thông số chi tiết và ưu đãi riêng, anh/chị cho em xin địa chỉ email nhé!"
            )
        return (
            f"Dạ, {domain.name} xin gửi anh/chị thông tin sản phẩm {target_prod.name} với giá ưu đãi là {target_prod.price:,} VND ạ:{img_tag}\n"
            f"Anh/chị cần em tư vấn thêm chi tiết hoặc hỗ trợ đặt hàng không ạ?"
        )

    # 5. If no email yet
    if not has_email:
        return (
            f"Chào anh/chị! Em là trợ lý AI của {domain.name}. Em rất vui được hỗ trợ giải đáp mọi thông tin cho mình. "
            f"Để em tiện gửi tài liệu chi tiết và ưu đãi riêng đến mình, anh/chị vui lòng cho em xin địa chỉ email được không ạ?"
        )

    # 6. If has email and has unanswered questions
    if unanswered_questions:
        next_q = unanswered_questions[0]
        return (
            f"Cảm ơn anh/chị đã chia sẻ thông tin ạ! Để bên em tư vấn giải pháp chính xác và tối ưu nhất cho mình, "
            f"{next_q} (complete)"
        )

    # 7. Default friendly response
    return (
        f"Dạ, {domain.name} luôn sẵn sàng hỗ trợ anh/chị. Anh/chị cần xem thêm về danh mục sản phẩm, bảng giá hay đặt lịch tư vấn trực tiếp thì nhắn em nhé ạ!"
    )


async def process_ai_chat(
    db: AsyncSession,
    domain_id: uuid.UUID,
    message: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
    customer_email: Optional[str] = None,
    chatroom_id: Optional[uuid.UUID] = None,
) -> Dict[str, Any]:
    """
    Main State Machine and RAG-powered chatbot processor.
    """
    history = chat_history or []
    user_msg_clean = message.strip()

    # 1. Fetch domain with related chatbot and user
    stmt = (
        select(Domain)
        .options(
            selectinload(Domain.chat_bot),
            selectinload(Domain.user),
        )
        .where(Domain.id == domain_id)
    )
    result = await db.execute(stmt)
    domain = result.scalar_one_or_none()

    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain with ID '{domain_id}' not found.",
        )

    # Fetch domain owner's billing subscription to check & deduct credits
    owner_billing: Optional[Billings] = None
    if domain.user_id:
        bill_stmt = select(Billings).where(Billings.user_id == domain.user_id)
        bill_res = await db.execute(bill_stmt)
        owner_billing = bill_res.scalar_one_or_none()
        if not owner_billing:
            owner_billing = Billings(
                id=uuid.uuid4(),
                plan=Plans.STANDARD,
                credits=100,
                user_id=domain.user_id,
            )
            db.add(owner_billing)
            await db.flush()

    # 2. Extract email from message if present, or use provided customer_email
    extracted_email = extract_email(user_msg_clean) or customer_email
    if extracted_email:
        extracted_email = extracted_email.strip().lower()

    # 3. Get or create Customer & ChatRoom
    customer, chatroom = await get_or_create_customer_and_room(
        db=db,
        domain=domain,
        email=extracted_email,
        chatroom_id=chatroom_id,
    )

    # 4. Check if Room is in LIVE mode
    if chatroom and chatroom.live:
        # Save user message to database
        user_chat_msg = ChatMessage(
            id=uuid.uuid4(),
            message=user_msg_clean,
            role=Role.user,
            seen=False,
            chat_room_id=chatroom.id,
        )
        db.add(user_chat_msg)
        chatroom.updated_at = datetime.now(timezone.utc)
        await db.commit()

        # Broadcast live user message to Dashboard Messenger via WebSocket
        try:
            await websocket_manager.broadcast_to_room(
                str(chatroom.id),
                {
                    "type": "new_message",
                    "room_id": str(chatroom.id),
                    "message": {
                        "id": str(user_chat_msg.id),
                        "message": user_chat_msg.message,
                        "role": "user",
                        "seen": False,
                        "chat_room_id": str(chatroom.id),
                        "created_at": user_chat_msg.created_at.isoformat()
                        if user_chat_msg.created_at
                        else datetime.now(timezone.utc).isoformat(),
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )
        except Exception as ws_err:
            logger.warning(f"Failed to broadcast live user message via WS: {ws_err}")

        # Notify domain owner via email if not already notified
        if not chatroom.mailed and domain.user and domain.user.email:
            try:
                await send_live_chat_alert(
                    owner_email=domain.user.email,
                    domain_name=domain.name,
                    customer_email=customer.email if customer else None,
                    last_message=user_msg_clean,
                )
                chatroom.mailed = True
                await db.commit()
            except Exception as e:
                logger.error(f"Failed to send live chat alert email: {e}")

        return {
            "id": str(user_chat_msg.id),
            "role": "assistant",
            "message": "Phòng chat đang kết nối trực tiếp với nhân viên tư vấn. Chuyên viên sẽ trả lời bạn trong giây lát!",
            "live": True,
            "customer_id": str(customer.id) if customer else None,
            "chatroom_id": str(chatroom.id),
            "link": None,
            "has_complete": False,
            "has_realtime": True,
            "credits_remaining": owner_billing.credits if owner_billing else None,
        }

    # 4.5. Check if domain owner has exhausted AI chat credits
    if owner_billing and owner_billing.credits <= 0:
        logger.warning(
            f"Domain '{domain.name}' (owner={domain.user_id}) has 0 AI chat credits remaining. Switching to live takeover."
        )
        if chatroom:
            chatroom.live = True
            chatroom.updated_at = datetime.now(timezone.utc)

        credits_exhausted_reply = (
            f"Dạ hiện tại trợ lý AI của {domain.name} tạm thời hết lượt phản hồi tự động. "
            f"Em xin phép chuyển tiếp cuộc trò chuyện sang chuyên viên tư vấn trực tiếp hỗ trợ mình ngay nhé ạ! (realtime)"
        )
        clean_exhausted_reply = re.sub(r"\(realtime\)", "", credits_exhausted_reply, flags=re.IGNORECASE).strip()

        user_msg_obj = None
        assistant_msg_obj = None
        if chatroom:
            user_msg_obj = ChatMessage(
                id=uuid.uuid4(),
                message=user_msg_clean,
                role=Role.user,
                seen=True,
                chat_room_id=chatroom.id,
            )
            assistant_msg_obj = ChatMessage(
                id=uuid.uuid4(),
                message=clean_exhausted_reply,
                role=Role.assistant,
                seen=True,
                chat_room_id=chatroom.id,
            )
            db.add(user_msg_obj)
            db.add(assistant_msg_obj)

            if not chatroom.mailed and domain.user and domain.user.email:
                try:
                    await send_live_chat_alert(
                        owner_email=domain.user.email,
                        domain_name=domain.name,
                        customer_email=customer.email if customer else None,
                        last_message=f"[HẾT CREDITS] {user_msg_clean}",
                    )
                    chatroom.mailed = True
                except Exception as mail_err:
                    logger.error(f"Failed to send credit alert email: {mail_err}")

        await db.commit()

        if chatroom and user_msg_obj and assistant_msg_obj:
            try:
                await websocket_manager.broadcast_to_room(
                    str(chatroom.id),
                    {
                        "type": "new_message",
                        "room_id": str(chatroom.id),
                        "message": {
                            "id": str(user_msg_obj.id),
                            "message": user_msg_obj.message,
                            "role": "user",
                            "seen": True,
                            "chat_room_id": str(chatroom.id),
                            "created_at": user_msg_obj.created_at.isoformat()
                            if user_msg_obj.created_at
                            else datetime.now(timezone.utc).isoformat(),
                        },
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
                await websocket_manager.broadcast_to_room(
                    str(chatroom.id),
                    {
                        "type": "new_message",
                        "room_id": str(chatroom.id),
                        "message": {
                            "id": str(assistant_msg_obj.id),
                            "message": clean_exhausted_reply,
                            "role": "assistant",
                            "seen": True,
                            "chat_room_id": str(chatroom.id),
                            "created_at": assistant_msg_obj.created_at.isoformat()
                            if assistant_msg_obj.created_at
                            else datetime.now(timezone.utc).isoformat(),
                            "link": None,
                        },
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
                await websocket_manager.broadcast_to_room(
                    str(chatroom.id),
                    {
                        "type": "live_mode_toggled",
                        "room_id": str(chatroom.id),
                        "live": True,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
            except Exception as ws_err:
                logger.warning(f"Failed to broadcast exhausted message: {ws_err}")

        return {
            "id": str(assistant_msg_obj.id) if assistant_msg_obj else None,
            "role": "assistant",
            "message": clean_exhausted_reply,
            "raw_message": credits_exhausted_reply,
            "live": True,
            "customer_id": str(customer.id) if customer else None,
            "chatroom_id": str(chatroom.id) if chatroom else None,
            "link": None,
            "has_complete": False,
            "has_realtime": True,
            "credits_remaining": 0,
        }

    # 5. If previous message asked a filter question with (complete), update answer
    if customer:
        await check_and_update_filter_answer(
            db=db,
            customer=customer,
            chat_history=history,
            new_message=user_msg_clean,
        )

    # 6. Gather unanswered filter questions
    unanswered_questions: List[str] = []
    if customer:
        resp_stmt = (
            select(CustomerResponses)
            .where(
                CustomerResponses.customer_id == customer.id,
                CustomerResponses.answered.is_(None),
            )
            .order_by(CustomerResponses.created_at.asc())
        )
        resp_res = await db.execute(resp_stmt)
        unanswered_questions = [r.question for r in resp_res.scalars().all()]
    else:
        # If no customer yet, read from domain's filter questions
        fq_stmt = (
            select(FilterQuestions)
            .where(FilterQuestions.domain_id == domain.id)
            .order_by(FilterQuestions.created_at.asc())
        )
        fq_res = await db.execute(fq_stmt)
        unanswered_questions = [fq.question for fq in fq_res.scalars().all()]

    # 7. Build RAG knowledge context
    knowledge_context, domain_products = await build_knowledge_context(db, domain, user_msg_clean)

    # 8. Prepare System Prompt & Chat Contents
    customer_id_str = str(customer.id) if customer else "lead"
    system_prompt = build_system_prompt(
        domain=domain,
        customer=customer,
        unanswered_questions=unanswered_questions,
        knowledge_context=knowledge_context,
        customer_id_str=customer_id_str,
    )

    # 9. Format messages for Gemini
    formatted_contents = []
    for item in history[-6:]:  # Keep recent 6 messages for context
        role = item.get("role")
        content = item.get("content") or item.get("message") or ""
        if role in ["user", "human"]:
            formatted_contents.append({"role": "user", "parts": [content]})
        elif role in ["assistant", "bot", "model"]:
            formatted_contents.append({"role": "model", "parts": [content]})

    formatted_contents.append({"role": "user", "parts": [user_msg_clean]})

    # 10. Call Gemini with Fallbacks
    raw_response_text = ""
    try:
        if settings.GEMINI_API_KEY and "your-gemini-api-key" not in settings.GEMINI_API_KEY.lower():
            response = await generate_content_with_fallback(
                contents=formatted_contents,
                system_instruction=system_prompt,
                generation_config={"temperature": 0.5, "max_output_tokens": 1024},
            )
            raw_response_text = response.text.strip()
    except Exception as exc:
        logger.warning(f"Gemini generation failed ({exc}). Using intelligent state-machine fallback.")

    if not raw_response_text:
        raw_response_text = simulate_ai_response(
            domain=domain,
            customer=customer,
            message=user_msg_clean,
            unanswered_questions=unanswered_questions,
            products=domain_products,
        )

    # 11. Post-process AI response keywords
    has_realtime = "(realtime)" in raw_response_text.lower()
    has_complete = "(complete)" in raw_response_text.lower()

    # Detect Portal links
    detected_link: Optional[str] = None
    link_match = PORTAL_LINK_REGEX.search(raw_response_text)
    if link_match:
        detected_link = link_match.group(0)

    # If (realtime) triggered, switch ChatRoom to LIVE mode
    is_live = False
    if has_realtime:
        is_live = True
        if chatroom:
            chatroom.live = True
            if not chatroom.mailed and domain.user and domain.user.email:
                try:
                    await send_live_chat_alert(
                        owner_email=domain.user.email,
                        domain_name=domain.name,
                        customer_email=customer.email if customer else None,
                        last_message=user_msg_clean,
                    )
                    chatroom.mailed = True
                except Exception as mail_err:
                    logger.error(f"Failed to send live alert email: {mail_err}")

    # Clean technical tags for user presentation
    clean_message = raw_response_text
    clean_message = re.sub(r"\(realtime\)", "", clean_message, flags=re.IGNORECASE).strip()
    clean_message = re.sub(r"\(complete\)", "", clean_message, flags=re.IGNORECASE).strip()

    # 12. Save messages to DB if chatroom exists
    user_msg_obj = None
    assistant_msg_obj = None
    if chatroom:
        user_msg_obj = ChatMessage(
            id=uuid.uuid4(),
            message=user_msg_clean,
            role=Role.user,
            seen=True,
            chat_room_id=chatroom.id,
        )
        assistant_msg_obj = ChatMessage(
            id=uuid.uuid4(),
            message=clean_message,
            role=Role.assistant,
            seen=True,
            chat_room_id=chatroom.id,
        )
        db.add(user_msg_obj)
        db.add(assistant_msg_obj)
        chatroom.updated_at = datetime.now(timezone.utc)

    # 12. Deduct 1 AI Chat credit from domain owner's subscription
    if owner_billing and owner_billing.credits > 0:
        owner_billing.credits = max(0, owner_billing.credits - 1)
        db.add(owner_billing)
        logger.info(
            f"Deducted 1 AI chat credit from owner {domain.user_id} of domain '{domain.name}'. "
            f"Remaining credits: {owner_billing.credits}"
        )

    await db.commit()

    if chatroom and user_msg_obj and assistant_msg_obj:
        try:
            # Broadcast user message
            await websocket_manager.broadcast_to_room(
                str(chatroom.id),
                {
                    "type": "new_message",
                    "room_id": str(chatroom.id),
                    "message": {
                        "id": str(user_msg_obj.id),
                        "message": user_msg_obj.message,
                        "role": "user",
                        "seen": True,
                        "chat_room_id": str(chatroom.id),
                        "created_at": user_msg_obj.created_at.isoformat()
                        if user_msg_obj.created_at
                        else datetime.now(timezone.utc).isoformat(),
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )
            # Broadcast assistant message
            await websocket_manager.broadcast_to_room(
                str(chatroom.id),
                {
                    "type": "new_message",
                    "room_id": str(chatroom.id),
                    "message": {
                        "id": str(assistant_msg_obj.id),
                        "message": clean_message,
                        "role": "assistant",
                        "seen": True,
                        "chat_room_id": str(chatroom.id),
                        "created_at": assistant_msg_obj.created_at.isoformat()
                        if assistant_msg_obj.created_at
                        else datetime.now(timezone.utc).isoformat(),
                        "link": detected_link,
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )
            if has_realtime:
                await websocket_manager.broadcast_to_room(
                    str(chatroom.id),
                    {
                        "type": "live_mode_toggled",
                        "room_id": str(chatroom.id),
                        "live": True,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
        except Exception as ws_err:
            logger.warning(f"Failed to broadcast chat messages via WS: {ws_err}")

    return {
        "id": str(assistant_msg_obj.id) if assistant_msg_obj else None,
        "role": "assistant",
        "message": clean_message,
        "raw_message": raw_response_text,
        "live": is_live,
        "customer_id": str(customer.id) if customer else None,
        "chatroom_id": str(chatroom.id) if chatroom else None,
        "link": detected_link,
        "has_complete": has_complete,
        "has_realtime": has_realtime,
        "credits_remaining": owner_billing.credits if owner_billing else None,
    }
