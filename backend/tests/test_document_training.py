import io
import uuid
import openpyxl
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token
from app.main import app
from app.models.domain import Domain
from app.models.user import User
from app.services.document_parser_service import (
    extract_chunks_from_file,
    parse_excel,
    parse_pdf,
    parse_text,
)


def test_document_parser_txt():
    content = "Chính sách đổi trả: 1 đổi 1 trong 30 ngày.\nHỗ trợ khách hàng 24/7.".encode("utf-8")
    chunks = parse_text(content, "policy.txt")
    assert len(chunks) >= 1
    assert "Chính sách đổi trả" in chunks[0]["content"]
    assert chunks[0]["title"] == "Đoạn 1"


def test_document_parser_excel():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "BaoGia"
    ws.append(["Mã SP", "Tên SP", "Đơn giá", "Ghi chú"])
    ws.append(["SP01", "Gói Cơ Bản", "500000", "Bảo hành 6 tháng"])
    ws.append(["SP02", "Gói Nâng Cao", "1200000", "Bảo hành 12 tháng"])

    buf = io.BytesIO()
    wb.save(buf)
    excel_bytes = buf.getvalue()

    chunks = parse_excel(excel_bytes, "baogia.xlsx")
    assert len(chunks) >= 1
    assert "SP01" in chunks[0]["content"]
    assert "Gói Nâng Cao" in chunks[0]["content"]
    assert "BaoGia" in chunks[0]["title"]


def test_detect_file_type():
    from app.services.document_parser_service import detect_file_type
    import pytest
    from fastapi import HTTPException

    assert detect_file_type("policy.pdf") == "pdf"
    assert detect_file_type("products.xlsx") == "excel"
    assert detect_file_type("products.xls") == "excel"
    assert detect_file_type("dataset.csv") == "excel"
    assert detect_file_type("notes.txt") == "txt"
    assert detect_file_type("guide.md") == "txt"

    with pytest.raises(HTTPException):
        detect_file_type("malware.exe")


@pytest.mark.asyncio
async def test_document_training_api_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Create test user and domain
        user_id = uuid.uuid4()
        domain_id = uuid.uuid4()
        user_email = f"trainer_{uuid.uuid4().hex[:6]}@example.com"

        async with AsyncSessionLocal() as session:
            user = User(
                id=user_id,
                fullname="Doc Trainer",
                email=user_email,
                hashed_password="hashed_pw_test",
                type="owner",
            )
            session.add(user)

            domain = Domain(
                id=domain_id,
                name="doctest.com",
                icon="https://example.com/icon.png",
                user_id=user_id,
            )
            session.add(domain)
            await session.commit()

        token = create_access_token(subject=str(user_id))
        auth_headers = {"Authorization": f"Bearer {token}"}

        # 2. Upload TXT document
        txt_content = (
            "Giới thiệu công ty ReplyEase AI:\n"
            "Chuyên cung cấp giải pháp trợ lý ảo bán hàng và chăm sóc khách hàng tự động.\n"
            "Chính sách bảo hành đổi mới hoàn toàn miễn phí nếu lỗi phát sinh từ máy chủ."
        ).encode("utf-8")

        files = {
            "file": ("huongdan.txt", io.BytesIO(txt_content), "text/plain")
        }
        res = await ac.post(
            f"/api/v1/domains/{domain_id}/documents",
            headers=auth_headers,
            files=files,
        )
        assert res.status_code == 201, res.text
        doc_data = res.json()
        doc_id = doc_data["id"]
        assert doc_data["file_name"] == "huongdan.txt"
        assert doc_data["file_type"] == "txt"
        assert doc_data["num_chunks"] >= 1
        assert doc_data["status"] == "completed"

        # 3. List documents
        res_list = await ac.get(
            f"/api/v1/domains/{domain_id}/documents",
            headers=auth_headers,
        )
        assert res_list.status_code == 200
        docs = res_list.json()
        assert len(docs) >= 1
        assert any(d["id"] == doc_id for d in docs)

        # 4. View document chunks
        res_chunks = await ac.get(
            f"/api/v1/domains/{domain_id}/documents/{doc_id}/chunks",
            headers=auth_headers,
        )
        assert res_chunks.status_code == 200
        chunks = res_chunks.json()
        assert len(chunks) == doc_data["num_chunks"]
        assert "ReplyEase AI" in chunks[0]["content"]

        # 5. Retrain document
        res_retrain = await ac.post(
            f"/api/v1/domains/{domain_id}/documents/{doc_id}/retrain",
            headers=auth_headers,
        )
        assert res_retrain.status_code == 200
        assert res_retrain.json()["id"] == doc_id

        # 6. Upload Excel document
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "MenuGia"
        ws.append(["Tên Món", "Giá"])
        ws.append(["Cà phê muối", "35000"])
        ws.append(["Trà sữa olong", "45000"])
        buf = io.BytesIO()
        wb.save(buf)

        excel_files = {
            "file": ("menu.xlsx", io.BytesIO(buf.getvalue()), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        }
        res_excel = await ac.post(
            f"/api/v1/domains/{domain_id}/documents",
            headers=auth_headers,
            files=excel_files,
        )
        assert res_excel.status_code == 201, res_excel.text
        excel_doc = res_excel.json()
        assert excel_doc["file_type"] == "excel"

        # 7. Delete document
        res_del = await ac.delete(
            f"/api/v1/domains/{domain_id}/documents/{doc_id}",
            headers=auth_headers,
        )
        assert res_del.status_code == 200
        assert res_del.json()["document_id"] == doc_id

        # Verify chunks deleted with document
        res_chunks_after = await ac.get(
            f"/api/v1/domains/{domain_id}/documents/{doc_id}/chunks",
            headers=auth_headers,
        )
        assert res_chunks_after.status_code == 404
