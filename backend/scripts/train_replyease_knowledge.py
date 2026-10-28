import asyncio
import os
import sys
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.domain import Domain
from app.models.knowledge_document import KnowledgeDocument, KnowledgeChunk
from app.services import document_parser_service, vector_service

FILE_PATH = r"d:\Workspace\rag\test_knowledge_replyease.txt"
DOMAIN_ID = uuid.UUID("02c09d6e-f3cb-46e5-9171-c067662a3929")
USER_ID = uuid.UUID("94441c79-7cc6-4768-91c8-ee25a6794fe3")


async def train_knowledge():
    print("=" * 65)
    print("📚 TIẾN HÀNH THÊM TÀI LIỆU TRI THỨC VÀO HỆ THỐNG (DATABASE & PINECONE)")
    print(f"   - File: {FILE_PATH}")
    print(f"   - Domain ID: {DOMAIN_ID}")
    print(f"   - User ID: {USER_ID}")
    print("=" * 65)

    if not os.path.exists(FILE_PATH):
        print(f"❌ File không tồn tại: {FILE_PATH}")
        return

    with open(FILE_PATH, "rb") as f:
        file_bytes = f.read()

    filename = os.path.basename(FILE_PATH)
    file_size = len(file_bytes)

    # 1. Trích xuất các đoạn chunks
    extracted_chunks = document_parser_service.extract_chunks_from_file(
        content=file_bytes,
        filename=filename,
        content_type="text/plain",
    )
    print(f"✅ Đã phân tích file thành {len(extracted_chunks)} đoạn chunks ngữ cảnh.")

    async with AsyncSessionLocal() as db:
        # Xác thực domain & user
        domain_res = await db.execute(select(Domain).where(Domain.id == DOMAIN_ID))
        domain = domain_res.scalar_one_or_none()
        if not domain:
            print(f"❌ Không tìm thấy domain {DOMAIN_ID}")
            return

        user_res = await db.execute(select(User).where(User.id == USER_ID))
        user = user_res.scalar_one_or_none()
        if not user:
            print(f"❌ Không tìm thấy user {USER_ID}")
            return

        print(f"✅ Xác thực thành công: User '{user.fullname}', Domain '{domain.name}'")

        # 2. Tạo bản ghi KnowledgeDocument
        doc = KnowledgeDocument(
            id=uuid.uuid4(),
            domain_id=DOMAIN_ID,
            file_name=filename,
            file_type="txt",
            file_size=file_size,
            status="completed",
            num_chunks=len(extracted_chunks),
            error_message=None,
        )
        db.add(doc)

        # 3. Tạo các bản ghi KnowledgeChunk
        chunk_models = []
        for idx, c in enumerate(extracted_chunks, start=1):
            chunk_obj = KnowledgeChunk(
                id=uuid.uuid4(),
                document_id=doc.id,
                domain_id=DOMAIN_ID,
                chunk_index=idx,
                title=c.get("title"),
                content=c.get("content", "").strip(),
            )
            chunk_models.append(chunk_obj)
            db.add(chunk_obj)

        await db.commit()
        await db.refresh(doc)
        print(f"✅ Đã lưu KnowledgeDocument '{doc.file_name}' (ID: {doc.id}) và {len(chunk_models)} chunks vào Database.")

        # 4. Vectorize & đồng bộ từng chunk lên Pinecone
        print("\n🌲 Đang vector hóa và đồng bộ lên Pinecone Vector DB...")
        pinecone_success_count = 0
        for c in chunk_models:
            sync_ok = await vector_service.upsert_knowledge(
                domain_id=DOMAIN_ID,
                record_id=c.id,
                text=c.content,
                metadata={
                    "type": "document",
                    "document_id": str(doc.id),
                    "file_name": doc.file_name,
                    "title": c.title or doc.file_name,
                },
            )
            if sync_ok:
                pinecone_success_count += 1
            print(f"   [{c.title}] -> Pinecone: {'✅ Thành công' if sync_ok else '⚠️ Thất bại'}")

        print(f"\n-> Kết quả đồng bộ Pinecone: {pinecone_success_count}/{len(chunk_models)} chunks.")

        # 5. Kiểm tra truy vấn thử nghiệm (RAG Retrieval Test)
        print("\n🔍 Kiểm tra truy vấn thử nghiệm RAG với kiến thức vừa nạp:")
        test_queries = [
            "Bảng giá các gói dịch vụ của ReplyEase AI?",
            "Chính sách bảo hành và đổi trả hoàn tiền?",
            "Tính năng thanh toán tự động qua SePay VietQR hoạt động ra sao?",
        ]
        for q in test_queries:
            matches = await vector_service.query_knowledge(
                domain_id=DOMAIN_ID,
                query=q,
                top_k=2,
            )
            print(f"\n❓ Câu hỏi: '{q}'")
            print(f"   -> Tìm thấy {len(matches)} kết quả liên quan:")
            for m in matches:
                title = m.get("metadata", {}).get("title", "Không tiêu đề")
                score = m.get("score", 0.0)
                txt_preview = m.get("text", "")[:120].replace("\n", " ")
                print(f"      • [{title} | score: {score:.3f}]: {txt_preview}...")

    print("\n" + "=" * 65)
    print("🎉 HOÀN TẤT THÊM TÀI LIỆU TRI THỨC VÀO HỆ THỐNG THÀNH CÔNG!")
    print("=" * 65)


if __name__ == "__main__":
    asyncio.run(train_knowledge())
