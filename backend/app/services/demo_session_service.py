import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, get_password_hash
from app.models.billing import Billings
from app.models.booking import Bookings
from app.models.chat_message import ChatMessage
from app.models.chatbot import ChatBot
from app.models.chatroom import ChatRoom
from app.models.customer import Customer
from app.models.customer_response import CustomerResponses
from app.models.domain import Domain
from app.models.enums import Plans
from app.models.filter_question import FilterQuestions
from app.models.helpdesk import HelpDesk
from app.models.knowledge_document import KnowledgeChunk, KnowledgeDocument
from app.models.product import Product
from app.models.user import User
from app.services import vector_service

logger = logging.getLogger(__name__)

MASTER_USER_ID = uuid.UUID("94441c79-7cc6-4768-91c8-ee25a6794fe3")
MASTER_DOMAIN_ID = uuid.UUID("02c09d6e-f3cb-46e5-9171-c067662a3929")
DEMO_SESSION_MINUTES = 30

# In-memory cache for master knowledge embeddings to allow instantaneous cloning (< 1s)
_MASTER_EMBEDDINGS_CACHE: Dict[str, List[float]] = {}


def get_cached_or_new_embedding(text: str, dim: int = 768) -> List[float]:
    """Retrieve pre-cached embedding or generate and cache it."""
    clean_text = text.strip()
    if clean_text in _MASTER_EMBEDDINGS_CACHE:
        return _MASTER_EMBEDDINGS_CACHE[clean_text]
    emb = vector_service.get_embedding(clean_text, dim=dim)
    _MASTER_EMBEDDINGS_CACHE[clean_text] = emb
    return emb


async def prewarm_master_embeddings(db: AsyncSession) -> int:
    """Precompute and cache master embeddings so demo session creation is instant (< 1s)."""
    try:
        vector_service.get_pinecone_index()
        dim = vector_service._index_info.get("dimension", 768) if vector_service._index_info else 768

        prods = (await db.execute(select(Product.name, Product.price, Product.image).where(Product.domain_id == MASTER_DOMAIN_ID))).fetchall()
        for name, price, img in prods:
            t = f"Sản phẩm: {name}. Giá: {price:,} VND. Hình ảnh: {img}"
            get_cached_or_new_embedding(t, dim=dim)

        faqs = (await db.execute(select(HelpDesk.question, HelpDesk.answer).where(HelpDesk.domain_id == MASTER_DOMAIN_ID))).fetchall()
        for q, a in faqs:
            t = f"Câu hỏi: {q}\nTrả lời: {a}"
            get_cached_or_new_embedding(t, dim=dim)

        chunks = (await db.execute(select(KnowledgeChunk.content).where(KnowledgeChunk.domain_id == MASTER_DOMAIN_ID))).fetchall()
        for (c,) in chunks:
            get_cached_or_new_embedding(c, dim=dim)

        logger.info(f"Prewarmed {len(_MASTER_EMBEDDINGS_CACHE)} master embeddings for instant demo cloning.")
        return len(_MASTER_EMBEDDINGS_CACHE)
    except Exception as e:
        logger.warning(f"Error prewarming master embeddings: {e}")
        return 0


async def cleanup_expired_demo_sessions(db: AsyncSession) -> int:
    """
    Purge demo sessions that have exceeded the 30-minute expiration limit.
    Deletes Pinecone namespaces and cascades database deletions.
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=DEMO_SESSION_MINUTES)
    stmt = (
        select(User)
        .where(User.type == "demo", User.created_at < cutoff_time)
        .options(selectinload(User.domains))
    )
    result = await db.execute(stmt)
    expired_users = list(result.scalars().all())

    if not expired_users:
        return 0

    count = 0
    for u in expired_users:
        # Extra safety check: never delete master template user
        if u.id == MASTER_USER_ID or u.email == "demo@gmail.com":
            continue

        # Delete Pinecone namespaces for all domains of this demo user
        for dom in u.domains:
            if dom.id == MASTER_DOMAIN_ID:
                continue
            try:
                await vector_service.delete_namespace(dom.id)
                logger.info(f"Cleaned up Pinecone namespace for expired demo domain {dom.id}")
            except Exception as e:
                logger.warning(f"Error deleting Pinecone namespace {dom.id}: {e}")

        # Delete user from DB (CASCADE deletes domain, products, chats, messages, docs, etc.)
        await db.delete(u)
        count += 1

    await db.commit()
    logger.info(f"Cleaned up {count} expired demo sessions from DB and Pinecone.")
    return count


async def create_demo_session(db: AsyncSession) -> Dict[str, Any]:
    """
    Create an isolated 30-minute demo sandbox cloned from the master template.
    Returns token and user data matching LoginSuccessResponse.
    """
    # 1. Fetch Master Domain and its dependencies
    master_domain_stmt = (
        select(Domain)
        .where(Domain.id == MASTER_DOMAIN_ID)
        .options(
            selectinload(Domain.chat_bot),
            selectinload(Domain.products),
            selectinload(Domain.helpdesk),
            selectinload(Domain.filter_questions),
            selectinload(Domain.knowledge_documents).selectinload(KnowledgeDocument.chunks),
            selectinload(Domain.customers).selectinload(Customer.chat_rooms).selectinload(ChatRoom.messages),
            selectinload(Domain.customers).selectinload(Customer.questions),
            selectinload(Domain.bookings),
        )
    )
    master_res = await db.execute(master_domain_stmt)
    master_domain = master_res.scalar_one_or_none()

    if not master_domain:
        raise RuntimeError("Master template domain not found. Please contact support.")

    # 3. Create Ephemeral Demo User
    session_uuid = uuid.uuid4()
    demo_email = f"demo_{session_uuid.hex[:8]}@replyease.ai"
    demo_user = User(
        id=uuid.uuid4(),
        fullname="Khách Trải Nghiệm Demo",
        email=demo_email,
        hashed_password=get_password_hash(uuid.uuid4().hex),
        type="demo",
    )
    db.add(demo_user)
    await db.flush()

    # 4. Create Billing Plan for Demo User (Pro with 500 credits)
    demo_billing = Billings(
        id=uuid.uuid4(),
        user_id=demo_user.id,
        plan=Plans.PRO,
        credits=500,
    )
    db.add(demo_billing)

    # 5. Clone Domain
    new_domain_id = uuid.uuid4()
    cloned_domain = Domain(
        id=new_domain_id,
        name=master_domain.name,
        icon=master_domain.icon,
        user_id=demo_user.id,
    )
    db.add(cloned_domain)
    await db.flush()

    # 6. Clone ChatBot
    if master_domain.chat_bot:
        mb = master_domain.chat_bot
        cloned_bot = ChatBot(
            id=uuid.uuid4(),
            welcome_message=mb.welcome_message,
            icon=mb.icon,
            background=mb.background,
            text_color=mb.text_color,
            helpdesk=mb.helpdesk,
            domain_id=new_domain_id,
        )
        db.add(cloned_bot)

    # 7. Clone Products & prepare Pinecone docs
    pinecone_index = vector_service.get_pinecone_index()
    pinecone_docs: List[Dict[str, Any]] = []
    dim = vector_service._index_info.get("dimension", 768) if vector_service._index_info else 768
    vec_field = vector_service._index_info.get("vector_field", "embedding") if vector_service._index_info else "embedding"
    is_doc_schema = vector_service._index_info.get("is_document_schema", False) if vector_service._index_info else False

    for p in master_domain.products:
        new_prod = Product(
            id=uuid.uuid4(),
            name=p.name,
            price=p.price,
            image=p.image,
            domain_id=new_domain_id,
        )
        db.add(new_prod)
        text_content = f"Sản phẩm: {p.name}. Giá: {p.price:,} VND. Hình ảnh: {p.image}"
        vector = get_cached_or_new_embedding(text_content, dim=dim)
        if is_doc_schema:
            pinecone_docs.append({
                "_id": str(new_prod.id),
                vec_field: vector,
                "text": text_content,
                "record_id": str(new_prod.id),
                "domain_id": str(new_domain_id),
                "type": "product",
                "name": p.name,
                "price": p.price,
            })
        else:
            pinecone_docs.append({
                "id": str(new_prod.id),
                "values": vector,
                "metadata": {
                    "text": text_content[:1000],
                    "record_id": str(new_prod.id),
                    "domain_id": str(new_domain_id),
                    "type": "product",
                    "name": p.name,
                    "price": p.price,
                },
            })

    # 8. Clone HelpDesk FAQs
    for f in master_domain.helpdesk:
        new_faq = HelpDesk(
            id=uuid.uuid4(),
            question=f.question,
            answer=f.answer,
            domain_id=new_domain_id,
        )
        db.add(new_faq)
        text_content = f"Câu hỏi: {f.question}\nTrả lời: {f.answer}"
        vector = get_cached_or_new_embedding(text_content, dim=dim)
        if is_doc_schema:
            pinecone_docs.append({
                "_id": str(new_faq.id),
                vec_field: vector,
                "text": text_content,
                "record_id": str(new_faq.id),
                "domain_id": str(new_domain_id),
                "type": "helpdesk",
                "question": f.question,
            })
        else:
            pinecone_docs.append({
                "id": str(new_faq.id),
                "values": vector,
                "metadata": {
                    "text": text_content[:1000],
                    "record_id": str(new_faq.id),
                    "domain_id": str(new_domain_id),
                    "type": "helpdesk",
                    "question": f.question,
                },
            })

    # 9. Clone FilterQuestions
    cloned_filter_questions = []
    for fq in master_domain.filter_questions:
        new_fq = FilterQuestions(
            id=uuid.uuid4(),
            question=fq.question,
            answered=None,
            domain_id=new_domain_id,
        )
        db.add(new_fq)
        cloned_filter_questions.append(new_fq)

    # 10. Clone KnowledgeDocuments & KnowledgeChunks
    for doc in master_domain.knowledge_documents:
        new_doc = KnowledgeDocument(
            id=uuid.uuid4(),
            domain_id=new_domain_id,
            file_name=doc.file_name,
            file_type=doc.file_type,
            file_size=doc.file_size,
            status=doc.status,
            num_chunks=doc.num_chunks,
            error_message=None,
        )
        db.add(new_doc)
        await db.flush()

        for c in doc.chunks:
            new_chunk = KnowledgeChunk(
                id=uuid.uuid4(),
                document_id=new_doc.id,
                domain_id=new_domain_id,
                chunk_index=c.chunk_index,
                title=c.title,
                content=c.content,
            )
            db.add(new_chunk)
            vector = get_cached_or_new_embedding(c.content, dim=dim)
            if is_doc_schema:
                pinecone_docs.append({
                    "_id": str(new_chunk.id),
                    vec_field: vector,
                    "text": c.content,
                    "record_id": str(new_chunk.id),
                    "domain_id": str(new_domain_id),
                    "type": "document",
                    "document_id": str(new_doc.id),
                    "file_name": new_doc.file_name,
                    "title": c.title or new_doc.file_name,
                })
            else:
                pinecone_docs.append({
                    "id": str(new_chunk.id),
                    "values": vector,
                    "metadata": {
                        "text": c.content[:1000],
                        "record_id": str(new_chunk.id),
                        "domain_id": str(new_domain_id),
                        "type": "document",
                        "document_id": str(new_doc.id),
                        "file_name": new_doc.file_name,
                        "title": c.title or new_doc.file_name,
                    },
                })

    # 11. Clone Customers, ChatRooms, ChatMessages, and CustomerResponses
    customer_id_map: Dict[uuid.UUID, uuid.UUID] = {}
    for cust in master_domain.customers:
        new_cust_id = uuid.uuid4()
        customer_id_map[cust.id] = new_cust_id

        new_cust = Customer(
            id=new_cust_id,
            email=cust.email,
            domain_id=new_domain_id,
            created_at=cust.created_at,
            updated_at=cust.updated_at,
        )
        db.add(new_cust)

        # Clone customer responses
        for q in cust.questions:
            new_q = CustomerResponses(
                id=uuid.uuid4(),
                question=q.question,
                answered=q.answered,
                customer_id=new_cust_id,
                created_at=q.created_at,
                updated_at=q.updated_at,
            )
            db.add(new_q)

        # Clone chat rooms and messages
        for room in cust.chat_rooms:
            new_room = ChatRoom(
                id=uuid.uuid4(),
                live=room.live,
                mailed=room.mailed,
                customer_id=new_cust_id,
                created_at=room.created_at,
                updated_at=room.updated_at,
            )
            db.add(new_room)
            for msg in room.messages:
                new_msg = ChatMessage(
                    id=uuid.uuid4(),
                    message=msg.message,
                    role=msg.role,
                    seen=msg.seen,
                    chat_room_id=new_room.id,
                    created_at=msg.created_at,
                    updated_at=msg.updated_at,
                )
                db.add(new_msg)

    # 12. Clone Bookings
    for b in master_domain.bookings:
        new_cust_fk = customer_id_map.get(b.customer_id)
        new_booking = Bookings(
            id=uuid.uuid4(),
            date=b.date,
            slot=b.slot,
            email=b.email,
            customer_id=new_cust_fk,
            domain_id=new_domain_id,
            created_at=b.created_at,
            updated_at=b.updated_at,
        )
        db.add(new_booking)

    # Commit all DB records
    await db.commit()
    await db.refresh(demo_user)

    # 13. Fast Batch Upsert to Pinecone under namespace=str(new_domain_id)
    if pinecone_docs:
        try:
            index = vector_service.get_pinecone_index()
            if index:
                if is_doc_schema:
                    index.documents.upsert(
                        namespace=str(new_domain_id),
                        documents=pinecone_docs,
                    )
                else:
                    index.upsert(
                        vectors=pinecone_docs,
                        namespace=str(new_domain_id),
                    )
                logger.info(f"Successfully batch-upserted {len(pinecone_docs)} vectors for demo domain {new_domain_id}")
        except Exception as exc:
            logger.error(f"Error during Pinecone batch-upsert for demo domain {new_domain_id}: {exc}")

    # 14. Create JWT Tokens
    access_token = create_access_token(demo_user.id)
    refresh_token = create_refresh_token(demo_user.id)

    return {
        "status": 200,
        "message": "Demo session initialized successfully! Enjoy exploring ReplyEase AI.",
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        },
        "user": {
            "id": str(demo_user.id),
            "fullname": demo_user.fullname,
            "email": demo_user.email,
            "type": "demo",
            "is_demo": True,
            "created_at": (demo_user.created_at or datetime.now(timezone.utc)).isoformat(),
            "demo_expires_at": (datetime.now(timezone.utc) + timedelta(minutes=DEMO_SESSION_MINUTES)).isoformat(),
            "subscription": {
                "plan": demo_billing.plan,
                "credits": demo_billing.credits,
            },
            "domains": [
                {
                    "id": str(cloned_domain.id),
                    "name": cloned_domain.name,
                    "icon": cloned_domain.icon,
                }
            ],
        },
    }


async def terminate_demo_session(user: User, db: AsyncSession) -> Dict[str, Any]:
    """
    Manually terminate a demo session:
    1. Verify user is indeed an ephemeral demo user (safety protection for Master account).
    2. Delete Pinecone namespace for each cloned domain.
    3. Delete the user record from Postgres (cascades to all domains, products, chats, etc.).
    """
    if user.id == MASTER_USER_ID or user.email == "demo@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tài khoản Master Template không thể hủy.",
        )

    is_demo = user.type == "demo" or user.email.startswith("demo_")
    if not is_demo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ phiên dùng thử (demo session) mới có thể thực hiện thao tác hủy này.",
        )

    # Fetch user's domains
    stmt = select(Domain).where(Domain.user_id == user.id)
    domains = (await db.execute(stmt)).scalars().all()

    for dom in domains:
        if dom.id == MASTER_DOMAIN_ID:
            continue
        try:
            await vector_service.delete_namespace(dom.id)
            logger.info(f"Cleaned up Pinecone namespace for terminated demo domain {dom.id}")
        except Exception as e:
            logger.warning(f"Error deleting Pinecone namespace for demo domain {dom.id}: {e}")

    # Delete the demo user from DB (ON DELETE CASCADE removes all associated records)
    await db.delete(user)
    await db.commit()

    return {
        "status": 200,
        "message": "Phiên dùng thử đã được hủy và toàn bộ dữ liệu tạm đã được dọn dẹp sạch sẽ.",
    }
