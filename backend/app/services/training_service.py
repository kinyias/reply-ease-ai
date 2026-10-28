import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.filter_question import FilterQuestions
from app.models.helpdesk import HelpDesk
from app.models.knowledge_document import KnowledgeDocument, KnowledgeChunk
from app.models.user import User
from app.schemas.training import (
    FilterQuestionCreateRequest,
    FilterQuestionUpdateRequest,
    HelpDeskCreateRequest,
    HelpDeskUpdateRequest,
)
from app.services import document_parser_service, vector_service
from app.services.domain_service import get_domain_by_id
from fastapi import UploadFile


# ==========================================
# 1. HelpDesk FAQ Management
# ==========================================


async def get_helpdesk_faqs(
    db: AsyncSession, domain_id: uuid.UUID, user: User
) -> List[HelpDesk]:
    """Retrieve all HelpDesk FAQ questions for a domain owned by user."""
    # Ensure domain ownership
    await get_domain_by_id(db, domain_id, user)

    stmt = (
        select(HelpDesk)
        .where(HelpDesk.domain_id == domain_id)
        .order_by(HelpDesk.created_at.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_helpdesk_faq(
    db: AsyncSession,
    domain_id: uuid.UUID,
    user: User,
    faq_in: HelpDeskCreateRequest,
) -> HelpDesk:
    """Create a new HelpDesk FAQ for a domain."""
    await get_domain_by_id(db, domain_id, user)

    faq = HelpDesk(
        id=uuid.uuid4(),
        question=faq_in.question.strip(),
        answer=faq_in.answer.strip(),
        domain_id=domain_id,
    )
    db.add(faq)
    await db.commit()
    await db.refresh(faq)

    # Sync RAG knowledge to Pinecone
    try:
        await vector_service.upsert_knowledge(
            domain_id=domain_id,
            record_id=faq.id,
            text=f"Câu hỏi: {faq.question}\nTrả lời: {faq.answer}",
            metadata={"type": "helpdesk", "question": faq.question},
        )
    except Exception:
        pass

    return faq


async def update_helpdesk_faq(
    db: AsyncSession,
    domain_id: uuid.UUID,
    faq_id: uuid.UUID,
    user: User,
    faq_in: HelpDeskUpdateRequest,
) -> HelpDesk:
    """Update an existing HelpDesk FAQ."""
    await get_domain_by_id(db, domain_id, user)

    stmt = select(HelpDesk).where(
        HelpDesk.id == faq_id, HelpDesk.domain_id == domain_id
    )
    result = await db.execute(stmt)
    faq = result.scalar_one_or_none()

    if not faq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"HelpDesk FAQ with ID '{faq_id}' not found.",
        )

    if faq_in.question is not None:
        faq.question = faq_in.question.strip()
    if faq_in.answer is not None:
        faq.answer = faq_in.answer.strip()

    await db.commit()
    await db.refresh(faq)

    # Sync updated FAQ knowledge to Pinecone
    try:
        await vector_service.upsert_knowledge(
            domain_id=domain_id,
            record_id=faq.id,
            text=f"Câu hỏi: {faq.question}\nTrả lời: {faq.answer}",
            metadata={"type": "helpdesk", "question": faq.question},
        )
    except Exception:
        pass

    return faq


async def delete_helpdesk_faq(
    db: AsyncSession, domain_id: uuid.UUID, faq_id: uuid.UUID, user: User
) -> bool:
    """Delete a HelpDesk FAQ item."""
    await get_domain_by_id(db, domain_id, user)

    stmt = select(HelpDesk).where(
        HelpDesk.id == faq_id, HelpDesk.domain_id == domain_id
    )
    result = await db.execute(stmt)
    faq = result.scalar_one_or_none()

    if not faq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"HelpDesk FAQ with ID '{faq_id}' not found.",
        )

    await db.delete(faq)
    await db.commit()

    # Delete vector from Pinecone
    try:
        await vector_service.delete_knowledge(domain_id=domain_id, record_id=faq_id)
    except Exception:
        pass

    return True


# ==========================================
# 2. Filter Questions (Lead Qualifier)
# ==========================================


async def get_filter_questions(
    db: AsyncSession, domain_id: uuid.UUID, user: User
) -> List[FilterQuestions]:
    """Retrieve all lead qualifier questions for a domain owned by user."""
    await get_domain_by_id(db, domain_id, user)

    stmt = (
        select(FilterQuestions)
        .where(FilterQuestions.domain_id == domain_id)
        .order_by(FilterQuestions.created_at.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_filter_question(
    db: AsyncSession,
    domain_id: uuid.UUID,
    user: User,
    q_in: FilterQuestionCreateRequest,
) -> FilterQuestions:
    """Create a new lead qualifier question for a domain."""
    await get_domain_by_id(db, domain_id, user)

    question = FilterQuestions(
        id=uuid.uuid4(),
        question=q_in.question.strip(),
        answered=None,
        domain_id=domain_id,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


async def update_filter_question(
    db: AsyncSession,
    domain_id: uuid.UUID,
    question_id: uuid.UUID,
    user: User,
    q_in: FilterQuestionUpdateRequest,
) -> FilterQuestions:
    """Update a lead qualifier question."""
    await get_domain_by_id(db, domain_id, user)

    stmt = select(FilterQuestions).where(
        FilterQuestions.id == question_id,
        FilterQuestions.domain_id == domain_id,
    )
    result = await db.execute(stmt)
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Filter question with ID '{question_id}' not found.",
        )

    if q_in.question is not None:
        question.question = q_in.question.strip()
    if q_in.answered is not None:
        question.answered = q_in.answered

    await db.commit()
    await db.refresh(question)
    return question


async def delete_filter_question(
    db: AsyncSession,
    domain_id: uuid.UUID,
    question_id: uuid.UUID,
    user: User,
) -> bool:
    """Delete a lead qualifier question."""
    await get_domain_by_id(db, domain_id, user)

    stmt = select(FilterQuestions).where(
        FilterQuestions.id == question_id,
        FilterQuestions.domain_id == domain_id,
    )
    result = await db.execute(stmt)
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Filter question with ID '{question_id}' not found.",
        )

    await db.delete(question)
    await db.commit()
    return True


# ==========================================
# 3. Knowledge Document Training (PDF, Excel, TXT)
# ==========================================


async def upload_and_train_document(
    db: AsyncSession,
    domain_id: uuid.UUID,
    user: User,
    file: UploadFile,
) -> KnowledgeDocument:
    """
    Validate, parse, chunk, persist and vectorize an uploaded document (PDF, Excel, TXT).
    """
    # 1. Verify domain ownership
    await get_domain_by_id(db, domain_id, user)

    # 2. Validate filename
    filename = file.filename or "unknown_file"
    file_type = document_parser_service.detect_file_type(filename, file.content_type)

    # 3. Read content and validate size (max 20MB)
    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tệp tải lên rỗng, không có dữ liệu.",
        )

    max_size_bytes = 20 * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dung lượng tệp ({len(content) // (1024*1024)}MB) vượt quá giới hạn tối đa 20MB.",
        )

    # 4. Extract structured chunks
    extracted_chunks = document_parser_service.extract_chunks_from_file(
        content=content,
        filename=filename,
        content_type=file.content_type,
    )

    if not extracted_chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không trích xuất được đoạn nội dung văn bản nào từ tệp đã tải lên.",
        )

    # 5. Create KnowledgeDocument record
    doc = KnowledgeDocument(
        id=uuid.uuid4(),
        domain_id=domain_id,
        file_name=filename,
        file_type=file_type,
        file_size=len(content),
        status="completed",
        num_chunks=len(extracted_chunks),
        error_message=None,
    )
    db.add(doc)

    # 6. Create KnowledgeChunk records
    chunk_models: List[KnowledgeChunk] = []
    for idx, c in enumerate(extracted_chunks, start=1):
        chunk_obj = KnowledgeChunk(
            id=uuid.uuid4(),
            document_id=doc.id,
            domain_id=domain_id,
            chunk_index=idx,
            title=c.get("title"),
            content=c.get("content", "").strip(),
        )
        chunk_models.append(chunk_obj)
        db.add(chunk_obj)

    await db.commit()
    await db.refresh(doc)

    # 7. Upsert chunks into Pinecone vector index
    for c_obj in chunk_models:
        try:
            await vector_service.upsert_knowledge(
                domain_id=domain_id,
                record_id=c_obj.id,
                text=c_obj.content,
                metadata={
                    "type": "document",
                    "document_id": str(doc.id),
                    "file_name": doc.file_name,
                    "title": c_obj.title or doc.file_name,
                },
            )
        except Exception:
            pass

    return doc


async def get_knowledge_documents(
    db: AsyncSession,
    domain_id: uuid.UUID,
    user: User,
) -> List[KnowledgeDocument]:
    """Retrieve all knowledge documents for a domain."""
    await get_domain_by_id(db, domain_id, user)

    stmt = (
        select(KnowledgeDocument)
        .where(KnowledgeDocument.domain_id == domain_id)
        .order_by(KnowledgeDocument.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_document_chunks(
    db: AsyncSession,
    domain_id: uuid.UUID,
    document_id: uuid.UUID,
    user: User,
) -> List[KnowledgeChunk]:
    """Retrieve all extracted chunks for a specific knowledge document."""
    await get_domain_by_id(db, domain_id, user)

    # Verify document belongs to domain
    doc_stmt = select(KnowledgeDocument).where(
        KnowledgeDocument.id == document_id,
        KnowledgeDocument.domain_id == domain_id,
    )
    doc_res = await db.execute(doc_stmt)
    doc = doc_res.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tài liệu với ID '{document_id}' không tồn tại.",
        )

    stmt = (
        select(KnowledgeChunk)
        .where(KnowledgeChunk.document_id == document_id)
        .order_by(KnowledgeChunk.chunk_index.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def delete_knowledge_document(
    db: AsyncSession,
    domain_id: uuid.UUID,
    document_id: uuid.UUID,
    user: User,
) -> bool:
    """Delete a knowledge document, its chunks, and associated vector embeddings."""
    await get_domain_by_id(db, domain_id, user)

    stmt = select(KnowledgeDocument).where(
        KnowledgeDocument.id == document_id,
        KnowledgeDocument.domain_id == domain_id,
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tài liệu với ID '{document_id}' không tồn tại.",
        )

    # Get chunks to remove from Pinecone
    chunk_stmt = select(KnowledgeChunk.id).where(
        KnowledgeChunk.document_id == document_id
    )
    chunk_res = await db.execute(chunk_stmt)
    chunk_ids = list(chunk_res.scalars().all())

    for c_id in chunk_ids:
        try:
            await vector_service.delete_knowledge(domain_id=domain_id, record_id=c_id)
        except Exception:
            pass

    await db.delete(doc)
    await db.commit()
    return True


async def retrain_knowledge_document(
    db: AsyncSession,
    domain_id: uuid.UUID,
    document_id: uuid.UUID,
    user: User,
) -> KnowledgeDocument:
    """Re-vectorize and re-sync all chunks of a document to Pinecone."""
    await get_domain_by_id(db, domain_id, user)

    stmt = select(KnowledgeDocument).where(
        KnowledgeDocument.id == document_id,
        KnowledgeDocument.domain_id == domain_id,
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tài liệu với ID '{document_id}' không tồn tại.",
        )

    chunk_stmt = select(KnowledgeChunk).where(
        KnowledgeChunk.document_id == document_id
    ).order_by(KnowledgeChunk.chunk_index.asc())
    chunk_res = await db.execute(chunk_stmt)
    chunks = list(chunk_res.scalars().all())

    for c in chunks:
        try:
            await vector_service.upsert_knowledge(
                domain_id=domain_id,
                record_id=c.id,
                text=c.content,
                metadata={
                    "type": "document",
                    "document_id": str(doc.id),
                    "file_name": doc.file_name,
                    "title": c.title or doc.file_name,
                },
            )
        except Exception:
            pass

    return doc
