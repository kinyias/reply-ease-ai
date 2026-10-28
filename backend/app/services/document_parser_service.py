import csv
import io
import logging
from typing import Dict, List, Optional
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {
    ".pdf": "pdf",
    ".xlsx": "excel",
    ".xls": "excel",
    ".txt": "txt",
    ".csv": "excel",
    ".md": "txt",
}


def detect_file_type(filename: str, content_type: Optional[str] = None) -> str:
    """
    Detect document type from filename extension or content-type.
    Returns: 'pdf', 'excel', or 'txt'.
    """
    ext = ""
    if "." in filename:
        ext = "." + filename.rsplit(".", 1)[-1].lower().strip()

    if ext in SUPPORTED_EXTENSIONS:
        return SUPPORTED_EXTENSIONS[ext]

    ct = (content_type or "").lower().strip()
    if "pdf" in ct:
        return "pdf"
    if "spreadsheet" in ct or "excel" in ct or "csv" in ct:
        return "excel"
    if "text" in ct:
        return "txt"

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Định dạng tệp '{filename}' không được hỗ trợ. Vui lòng tải lên file .pdf, .xlsx, .xls, .txt, .csv, hoặc .md",
    )


def _split_text_into_chunks(
    text: str,
    max_chunk_size: int = 800,
    chunk_overlap: int = 100,
) -> List[str]:
    """
    Split long text into semantic chunks by paragraphs, falling back to sentence/word splitting.
    """
    clean_text = text.strip()
    if not clean_text:
        return []

    if len(clean_text) <= max_chunk_size:
        return [clean_text]

    paragraphs = [p.strip() for p in clean_text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [p.strip() for p in clean_text.split("\n") if p.strip()]

    chunks: List[str] = []
    current_chunk: List[str] = []
    current_length = 0

    for para in paragraphs:
        para_len = len(para)
        if current_length + para_len + 2 > max_chunk_size:
            if current_chunk:
                chunks.append("\n\n".join(current_chunk).strip())
                # keep last element for overlap if long enough
                overlap_text = current_chunk[-1] if len(current_chunk[-1]) < chunk_overlap else ""
                current_chunk = [overlap_text, para] if overlap_text else [para]
                current_length = sum(len(c) for c in current_chunk) + 2
            else:
                # single paragraph exceeds max_chunk_size; split by sentences or chunks
                while len(para) > max_chunk_size:
                    split_point = para.rfind(" ", 0, max_chunk_size)
                    if split_point == -1:
                        split_point = max_chunk_size
                    chunks.append(para[:split_point].strip())
                    para = para[max(0, split_point - chunk_overlap):].strip()
                if para:
                    current_chunk = [para]
                    current_length = len(para)
        else:
            current_chunk.append(para)
            current_length += para_len + 2

    if current_chunk:
        chunk_str = "\n\n".join(current_chunk).strip()
        if chunk_str:
            chunks.append(chunk_str)

    return chunks


def parse_pdf(content: bytes) -> List[Dict[str, str]]:
    """
    Extract text chunks from a PDF file using pypdf.
    Returns a list of dicts: [{'title': 'Trang 1', 'content': '...'}]
    """
    try:
        import pypdf
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Thư viện pypdf chưa được cài đặt trên hệ thống.",
        )

    chunks: List[Dict[str, str]] = []
    try:
        reader = pypdf.PdfReader(io.BytesIO(content))
        total_pages = len(reader.pages)

        for page_idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            clean_page_text = page_text.strip()
            if not clean_page_text:
                continue

            page_num = page_idx + 1
            page_chunks = _split_text_into_chunks(clean_page_text, max_chunk_size=900)

            for c_idx, chunk in enumerate(page_chunks):
                title = f"Trang {page_num}" if len(page_chunks) == 1 else f"Trang {page_num} (Phần {c_idx + 1})"
                chunks.append({
                    "title": title,
                    "content": f"[Tài liệu PDF - {title} / Tổng {total_pages} trang]\n{chunk}",
                })

    except Exception as exc:
        logger.error(f"Error parsing PDF: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể đọc file PDF: {str(exc)}",
        )

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File PDF không chứa văn bản có thể trích xuất (có thể là file scan hình ảnh).",
        )

    return chunks


def parse_excel(content: bytes, filename: str) -> List[Dict[str, str]]:
    """
    Extract structured row/column chunks from an Excel spreadsheet (.xlsx, .xls, .csv).
    """
    chunks: List[Dict[str, str]] = []
    lower_name = filename.lower()

    # Handle CSV separately
    if lower_name.endswith(".csv"):
        try:
            text_str = ""
            for encoding in ("utf-8-sig", "utf-8", "cp1258", "latin-1"):
                try:
                    text_str = content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue

            if not text_str:
                text_str = content.decode("utf-8", errors="replace")

            reader = csv.reader(io.StringIO(text_str))
            rows = [row for row in reader if any(cell.strip() for cell in row)]
            if not rows:
                raise HTTPException(status_code=400, detail="File CSV không có dữ liệu.")

            headers = [h.strip() for h in rows[0]]
            data_rows = rows[1:]

            row_batch: List[str] = []
            start_row = 2

            for r_idx, row in enumerate(data_rows, start=2):
                row_items = []
                for h_idx, cell_val in enumerate(row):
                    h_name = headers[h_idx] if h_idx < len(headers) and headers[h_idx] else f"Cột {h_idx + 1}"
                    val = cell_val.strip()
                    if val:
                        row_items.append(f"{h_name}: {val}")
                if row_items:
                    row_batch.append(f"Dòng {r_idx}: " + " | ".join(row_items))

                if len(row_batch) >= 5 or (sum(len(r) for r in row_batch) > 700):
                    end_row = r_idx
                    title = f"Dòng {start_row}-{end_row}"
                    batch_text = "\n".join(row_batch)
                    chunks.append({
                        "title": title,
                        "content": f"[Bảng CSV - {title}]\n{batch_text}",
                    })
                    row_batch = []
                    start_row = r_idx + 1

            if row_batch:
                end_row = len(data_rows) + 1
                title = f"Dòng {start_row}-{end_row}"
                batch_text = "\n".join(row_batch)
                chunks.append({
                    "title": title,
                    "content": f"[Bảng CSV - {title}]\n{batch_text}",
                })

            return chunks
        except Exception as exc:
            logger.error(f"Error parsing CSV: {exc}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Lỗi đọc file CSV: {str(exc)}",
            )

    # Handle XLSX via openpyxl
    try:
        import openpyxl
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Thư viện openpyxl chưa được cài đặt trên hệ thống.",
        )

    try:
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        for sheet_name in wb.sheetnames:
            sheet = wb[sheet_name]
            all_rows = list(sheet.iter_rows(values_only=True))
            if not all_rows:
                continue

            # Find header row (first non-empty row)
            header_row_idx = None
            headers: List[str] = []
            for idx, r in enumerate(all_rows):
                if any(cell is not None and str(cell).strip() for cell in r):
                    header_row_idx = idx
                    headers = [str(c).strip() if c is not None else "" for c in r]
                    break

            if header_row_idx is None:
                continue

            row_batch: List[str] = []
            start_row = header_row_idx + 2

            for r_idx, row in enumerate(all_rows[header_row_idx + 1:], start=header_row_idx + 2):
                if not any(c is not None and str(c).strip() for c in row):
                    continue

                row_items = []
                for c_idx, cell in enumerate(row):
                    if cell is None:
                        continue
                    val_str = str(cell).strip()
                    if not val_str:
                        continue
                    h_name = headers[c_idx] if c_idx < len(headers) and headers[c_idx] else f"Cột {c_idx + 1}"
                    row_items.append(f"{h_name}: {val_str}")

                if row_items:
                    row_batch.append(f"Dòng {r_idx}: " + " | ".join(row_items))

                if len(row_batch) >= 6 or (sum(len(r) for r in row_batch) > 800):
                    end_row = r_idx
                    title = f"Sheet '{sheet_name}' (Dòng {start_row}-{end_row})"
                    batch_text = "\n".join(row_batch)
                    chunks.append({
                        "title": title,
                        "content": f"[Bảng tính Excel - {title}]\n{batch_text}",
                    })
                    row_batch = []
                    start_row = r_idx + 1

            if row_batch:
                end_row = len(all_rows)
                title = f"Sheet '{sheet_name}' (Dòng {start_row}-{end_row})"
                batch_text = "\n".join(row_batch)
                chunks.append({
                    "title": title,
                    "content": f"[Bảng tính Excel - {title}]\n{batch_text}",
                })

    except Exception as exc:
        logger.error(f"Error parsing Excel spreadsheet: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể đọc file Excel: {str(exc)}",
        )

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File Excel không có dữ liệu hợp lệ để huấn luyện.",
        )

    return chunks


def parse_text(content: bytes, filename: str) -> List[Dict[str, str]]:
    """
    Extract text chunks from plain text or markdown files (.txt, .md).
    """
    text_str = ""
    for encoding in ("utf-8-sig", "utf-8", "cp1258", "latin-1"):
        try:
            text_str = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    if not text_str:
        text_str = content.decode("utf-8", errors="replace")

    clean_text = text_str.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File văn bản rỗng, không có nội dung.",
        )

    raw_chunks = _split_text_into_chunks(clean_text, max_chunk_size=850)
    chunks: List[Dict[str, str]] = []

    for idx, c in enumerate(raw_chunks, start=1):
        title = f"Đoạn {idx}"
        chunks.append({
            "title": title,
            "content": f"[Tài liệu văn bản {filename} - {title}]\n{c}",
        })

    return chunks


def extract_chunks_from_file(
    content: bytes,
    filename: str,
    content_type: Optional[str] = None,
) -> List[Dict[str, str]]:
    """
    Master dispatcher to parse file content based on detected type.
    Returns list of chunks with title and content.
    """
    file_type = detect_file_type(filename, content_type)

    if file_type == "pdf":
        return parse_pdf(content)
    elif file_type == "excel":
        return parse_excel(content, filename)
    elif file_type == "txt":
        return parse_text(content, filename)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không hỗ trợ định dạng '{file_type}'.",
        )
