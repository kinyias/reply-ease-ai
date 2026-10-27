import asyncio
import os
import sys
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services import vector_service

async def test_pinecone():
    print("==================================================")
    print("🌲 Testing Pinecone Vector Service (Document Schema & Classic)")
    print("==================================================")

    # 1. Init index & verify schema inspection
    index = vector_service.get_pinecone_index()
    assert index is not None, "Failed to initialize Pinecone index client"
    info = vector_service._index_info
    print(f"✅ Pinecone index connected: {info}")

    # 2. Test Gemini embedding
    text = "Xin chào, tôi cần tư vấn về sản phẩm và dịch vụ của bạn."
    emb = vector_service.get_embedding(text)
    dim = info.get("dimension", 768) if info else 768
    assert len(emb) == dim, f"Expected {dim}-dim embedding, got {len(emb)}"
    print(f"✅ Embedding generated successfully (dimensions: {len(emb)})")

    # 3. Test upsert_knowledge
    domain_id = uuid.uuid4()
    record_id = uuid.uuid4()
    sample_text = "Gói Dịch Vụ Chăm Sóc Khách Hàng Cao Cấp 2,000,000 VND / tháng"
    meta = {"type": "product", "name": "Gói Chăm Sóc Khách Hàng", "price": 2000000}

    upsert_ok = await vector_service.upsert_knowledge(
        domain_id=domain_id,
        record_id=record_id,
        text=sample_text,
        metadata=meta,
    )
    assert upsert_ok is True, "Failed to upsert knowledge into Pinecone"
    print(f"✅ upsert_knowledge succeeded for record {record_id} under namespace {domain_id}")

    # 4. Test query_knowledge
    print("🔍 Testing query_knowledge...")
    matches = await vector_service.query_knowledge(
        domain_id=domain_id,
        query="gói chăm sóc khách hàng",
        top_k=2,
    )
    print(f"✅ query_knowledge completed: {len(matches)} matches returned")

    # 5. Test delete_knowledge (fixing the user's specific bug!)
    delete_ok = await vector_service.delete_knowledge(
        domain_id=domain_id,
        record_id=record_id,
    )
    assert delete_ok is True, "Failed to delete knowledge from Pinecone"
    print(f"✅ delete_knowledge succeeded for record {record_id} without any 400 document schema error!")

    # 6. Test delete_namespace cleanup
    del_ns_ok = await vector_service.delete_namespace(domain_id=domain_id)
    assert del_ns_ok is True, "Failed to delete namespace"
    print(f"✅ delete_namespace succeeded for namespace {domain_id}")

    print("==================================================")
    print("🎉 ALL PINECONE OPERATIONS PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_pinecone())
