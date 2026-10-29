<div align="center">

<img src="./assets/hero-banner.png" alt="ReplyEase AI Banner" width="100%" />

# ReplyEase AI
### Nền tảng AI Chăm sóc Khách hàng, Đặt lịch & Bán hàng Tự động Toàn diện

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash--Lite-4285F4.svg?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector%20DB-000000.svg?style=flat-square&logo=pinecone&logoColor=white)](https://www.pinecone.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

[English](README.md) &bull; Tiếng Việt

</div>

---

## 📌 Giới thiệu Tổng quan

**ReplyEase AI** là nền tảng SaaS hoàn chỉnh kết hợp sức mạnh của **Trí tuệ nhân tạo (AI)**, cơ chế tìm kiếm tăng cường truy xuất thông tin (**RAG - Retrieval-Augmented Generation**), công nghệ truyền tin tức thời **WebSockets** và **Widget nhúng đa nền tảng** để tự động hóa toàn bộ quy trình chăm sóc khách hàng, tư vấn sản phẩm, thu thập khách hàng tiềm năng (Leads), đặt lịch hẹn và xác nhận thanh toán tự động 24/7.

Khi gặp những tình huống nghiệp vụ phức tạp hoặc khách hàng yêu cầu hỗ trợ đặc biệt, tư vấn viên có thể theo dõi trực tiếp và **tiếp quản cuộc trò chuyện (Takeover)** ngay lập tức mà không làm gián đoạn trải nghiệm của khách hàng.

---

## 📸 Hình ảnh Giao diện Thực tế

<div align="center">

### 1. Widget Chatbot AI & Trợ lý Bán hàng Tự động
*Giao diện chatbot khách hàng mượt mà, tích hợp xem danh mục sản phẩm, chuyển đổi đa ngôn ngữ và sàng lọc thông tin tự động.*

<img src="./assets/chat-widget.png" alt="ReplyEase AI Chat Widget" width="480px" />

---

### 2. Quản lý Hội thoại Thời gian thực & Tiếp quản Cuộc trò chuyện
*Hộp thư hội thoại trực tiếp đa kênh, hỗ trợ WebSockets độ trễ cực thấp, chuyển đổi linh hoạt giữa chế độ AI Tự động và Nhân viên Live Mode.*

<img src="./assets/chat.png" alt="Giao diện Live Conversations Dashboard" width="100%" />

---

### 3. Huấn luyện Tri thức AI & Nạp Dữ liệu RAG Đa định dạng
*Huấn luyện trợ lý ảo thông qua câu hỏi thường gặp (HelpDesk FAQ), câu hỏi sàng lọc khách hàng tiềm năng và tài liệu (PDF, Excel, Plain Text) đồng bộ lên Pinecone Vector DB.*

<img src="./assets/rag.png" alt="Giao diện Bot Training & RAG Dashboard" width="100%" />

</div>

---

## ✨ Tính năng Nổi bật

### 🤖 1. Trợ lý AI Bán hàng & Tư vấn Tự động 24/7
- **Tích hợp Google Gemini**: Vận hành trên mô hình `gemini-3.1-flash-lite` cho tốc độ phản hồi cực nhanh, chuẩn xác kèm cơ chế dự phòng tự động chuyển đổi mô hình linh hoạt (`gemini-3.5-flash-lite`, `gemini-2.5-flash`, `gemini-3-flash`).
- **Ghi nhớ ngữ cảnh thông minh**: Nhận diện ý định, lưu trữ lịch sử đối thoại và duy trì phong cách thương hiệu nhất quán.
- **Tự động lọc khách hàng tiềm năng (Lead Qualification)**: Đặt các câu hỏi khảo sát tùy chỉnh (nhu cầu, mức ngân sách, kích cỡ, hạn định) và thu thập email/số điện thoại để chuyển giao cho bộ phận kinh doanh.

### 📚 2. Huấn luyện Tri thức RAG Đa định dạng (Vector Search)
- **Nạp dữ liệu tài liệu**: Hỗ trợ tải lên tài liệu **PDF (`.pdf`)**, bảng tính **Excel (`.xlsx`, `.xls`, `.csv`)** và tệp văn bản **Plain Text (`.txt`, `.md`)** dung lượng lên đến 20MB.
- **Phân tách ngữ nghĩa thông minh (Semantic Chunking)**: Tự động trích xuất nội dung, chuẩn hóa bảng biểu và chia đoạn theo ngữ cảnh logic.
- **Lưu trữ & Truy vấn Vector trên Pinecone**: Ứng dụng `gemini-embedding-001` để mã hóa tri thức thành vector đa chiều, phân chia namespace độc lập theo từng Domain doanh nghiệp.
- **HelpDesk FAQ**: Quản lý bộ câu hỏi - giải đáp chính sách (đổi trả, bảo hành, phí vận chuyển) để trả lời chính xác 100%.

### 💬 3. Hội thoại Thời gian thực & Can thiệp Nhân sự (Human-in-the-Loop)
- **Truyền tin tức thời qua WebSockets**: Đồng bộ tin nhắn 2 chiều giữa khách truy cập và trang quản trị với độ trễ tính bằng mili-giây.
- **Chuyển đổi AI / Live Mode**: Tư vấn viên có thể bật/tắt quyền trả lời của AI hoặc trực tiếp gửi tin nhắn để tiếp quản xử lý ngay lập tức.
- **Tiện ích trợ lực tư vấn**: Gợi ý tin nhắn mẫu thông minh (Canned Responses), gắn nhãn trạng thái khẩn cấp, lọc tin chưa đọc và thống kê câu hỏi đã hoàn thành.

### 🛍️ 4. Hiển thị Sản phẩm & Đặt lịch Hẹn Ngay trong Chat
- **Danh mục sản phẩm tương tác**: Khách hàng có thể duyệt ảnh sản phẩm, xem giá bán và mô tả trực tiếp bên trong widget.
- **Đặt lịch hẹn thông minh (Booking)**: Khách hàng dễ dàng lựa chọn khung giờ và ngày hẹn thử đồ / tư vấn chuyên sâu.
- **Cổng thông tin khách hàng (Customer Portal)**: Trang chuyên biệt để khách hàng quản lý đơn hàng và theo dõi lịch hẹn.

### 💳 5. Thanh toán Tự động VietQR & SePay
- **Tạo mã VietQR động tức thì**: Khách hàng quét mã QR ngân hàng với đúng số tiền và nội dung đơn hàng được điền sẵn.
- **Xác nhận giao dịch tự động qua Webhook**: Kết nối cùng **SePay** để lắng nghe biến động số dư và kích hoạt đơn hàng / nâng cấp gói dịch vụ (Standard, Pro, Ultimate) tự động trong 3 giây.

### 🧩 6. Widget Nhúng Website Tối ưu & Gọn nhẹ
- **Tích hợp trong 1 phút**: Nhúng qua 1 thẻ `<script>` hoặc thẻ `<iframe>` vào mọi nền tảng (Shopify, WordPress, Haravan, landing page tùy biến).
- **Cá nhân hóa giao diện**: Thay đổi màu chủ đạo, ảnh đại diện bot, lời chào và tiêu đề theo bộ nhận diện thương hiệu.
- **Đa ngôn ngữ & Chế độ Sáng/Tối**: Hỗ trợ chuyển đổi nhanh Tiếng Việt và Tiếng Anh cùng giao diện Light/Dark Mode hiện đại.

---

## 🏗️ Kiến trúc Hệ thống

```mermaid
flowchart TD
    subgraph Client["Giao diện Người dùng & Khách hàng"]
        Widget["Widget Chatbot Website<br/>(widget.js / iframe)"]
        Dashboard["Next.js 16 Dashboard Quản trị<br/>(App Router, React 19, Tailwind)"]
        Portal["Customer Portal<br/>(Đặt lịch hẹn & Thanh toán)"]
    end

    subgraph Backend["FastAPI Backend Server"]
        Router["API Gateway / Bộ định tuyến"]
        WS["WebSocket Manager<br/>(Truyền tải tin nhắn thời gian thực)"]
        AuthSvc["Dịch vụ Xác thực & JWT"]
        AIBotSvc["Trợ lý AI & Động cơ Bán hàng"]
        RAGSvc["Xử lý Tài liệu & RAG Pipeline"]
        PaySvc["Xử lý Webhook SePay & VietQR"]
    end

    subgraph Storage["Cơ sở Dữ liệu & Dịch vụ Ngoài"]
        PG[("PostgreSQL Database<br/>(Người dùng, Domain, Hội thoại, Đơn hàng)")]
        Pinecone[("Pinecone Vector DB<br/>(Vector Embeddings theo Domain)")]
        Gemini["Google Gemini AI<br/>(Flash-Lite & Embeddings API)"]
        SePay["Cổng Thanh toán SePay<br/>(Giao dịch VietQR tự động)"]
        Cloudinary["Cloudinary / File Storage<br/>(Lưu trữ tài liệu & hình ảnh)"]
    end

    Widget -->|HTTP / REST| Router
    Widget <-->|WebSockets| WS
    Dashboard -->|REST API| Router
    Dashboard <-->|WebSockets| WS
    Portal -->|REST API| Router

    Router --> AuthSvc
    Router --> AIBotSvc
    Router --> RAGSvc
    Router --> PaySvc

    AIBotSvc <-->|Truy vấn tương đồng| Pinecone
    AIBotSvc <-->|Prompt & Phản hồi| Gemini
    RAGSvc -->|Tạo Vector Embeddings| Gemini
    RAGSvc -->|Lưu trữ Vector| Pinecone

    AuthSvc --> PG
    AIBotSvc --> PG
    PaySvc <-->|Nhận thông báo Webhook| SePay
    PaySvc --> PG
    RAGSvc --> Cloudinary
```

---

## 🛠️ Công nghệ Sử dụng

| Thành phần | Công nghệ |
|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/) / [Shadcn UI](https://ui.shadcn.com/), [TanStack Query v5](https://tanstack.com/query), [Zustand](https://zustand-demo.pmnd.rs/), [Recharts](https://recharts.org/), [Lucide Icons](https://lucide.dev/) |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/), [Python 3.11+](https://www.python.org/), [Uvicorn](https://www.uvicorn.org/), [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Bất đồng bộ với `asyncpg`), [Alembic](https://alembic.sqlalchemy.org/), [Pydantic v2](https://docs.pydantic.dev/), [WebSockets](https://websockets.readthedocs.io/) |
| **AI & Vector DB** | [Google Generative AI SDK](https://ai.google.dev/) (`gemini-3.1-flash-lite`, `gemini-embedding-001`), [Pinecone Client v5](https://www.pinecone.io/) |
| **Cơ sở dữ liệu** | [PostgreSQL 15+](https://www.postgresql.org/) với quản lý phiên kết nối tối ưu |
| **Cổng thanh toán** | [SePay](https://sepay.vn/) (Xác thực giao dịch chuyển khoản VietQR tự động qua Webhook) |
| **Lưu trữ & Xử lý**| [Cloudinary](https://cloudinary.com/), `pypdf` (Trích xuất PDF), `openpyxl` (Xử lý Excel) |
| **Bảo mật & Auth** | JWT (`python-jose`), mã hóa mật khẩu `bcrypt`, kiểm soát CORS, phân vùng dữ liệu Domain |

---

## 📁 Cấu trúc Dự án

```text
reply-ease-ai/
├── assets/                     # Hình ảnh chụp giao diện và banner tài liệu
│   ├── chat-widget.png         # Giao diện widget chatbot khách hàng
│   ├── chat.png                # Giao diện quản lý hội thoại Live Mode
│   ├── hero-banner.png         # Banner chính của dự án ReplyEase AI
│   └── rag.png                 # Giao diện huấn luyện tài liệu RAG & FAQs
├── backend/                    # Mã nguồn Backend FastAPI
│   ├── alembic/                # Tệp quản lý migration cơ sở dữ liệu
│   ├── app/
│   │   ├── api/v1/             # Định tuyến REST API & WebSockets
│   │   │   └── endpoints/      # Đăng nhập, Chatbot, Domain, Sản phẩm, Thanh toán,...
│   │   ├── core/               # Cấu hình biến môi trường, bảo mật, kết nối DB
│   │   ├── models/             # Định nghĩa bảng SQLAlchemy (User, Domain, ChatRoom, Product,...)
│   │   ├── schemas/            # Lớp Pydantic xác thực dữ liệu đầu vào/ra
│   │   ├── services/           # Nghiệp vụ (Gemini AI, Pinecone Vector, Email, RAG, SePay)
│   │   └── main.py             # Điểm khởi chạy FastAPI và vòng đời lifespan
│   ├── scripts/                # Tập lệnh kiểm tra, dọn dẹp và seed dữ liệu mẫu
│   ├── tests/                  # Bộ kiểm thử tự động Pytest
│   ├── .env.example            # Bản mẫu cấu hình biến môi trường Backend
│   └── requirements.txt        # Danh mục thư viện Python
└── frontend/                   # Ứng dụng giao diện Next.js 16
    ├── app/                    # Next.js App Router
    │   ├── (dashboard)/        # Trang quản trị (Hội thoại, Huấn luyện bot, Cài đặt, Thanh toán)
    │   ├── auth/               # Đăng nhập, Đăng ký, Quên mật khẩu
    │   ├── chatbot/            # Trang nhúng chatbot cho Widget
    │   └── portal/             # Trang cổng khách hàng đặt lịch & đặt hàng
    ├── components/             # Thành phần giao diện tái sử dụng (Shadcn + UI tùy chỉnh)
    ├── context/                # Trình cung cấp trạng thái React (i18n, Theme, Auth)
    ├── lib/                    # Bộ công cụ tiện ích, Axios client và từ điển đa ngôn ngữ (vi, en)
    ├── public/                 # Tệp tĩnh và mã nhúng widget.js
    ├── .env.local.example      # Bản mẫu cấu hình biến môi trường Frontend
    └── package.json            # Thư viện npm và lệnh khởi chạy
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### Yêu cầu Tiên quyết

Đảm bảo máy tính của bạn đã cài đặt:
- **Node.js** >= 20.x
- **Python** >= 3.11
- **PostgreSQL** >= 14
- Tài khoản & Khóa API:
  - [Google AI Studio](https://aistudio.google.com/) (Khóa Gemini API)
  - [Pinecone](https://www.pinecone.io/) (Khóa API & Tên Index Pinecone)
  - [SePay](https://sepay.vn/) (Merchant ID & Secret Key - kiểm tra thanh toán)
  - [Cloudinary](https://cloudinary.com/) (Tùy chọn tải ảnh lên đám mây)

---

### 1. Sao chép Mã nguồn (Clone Repository)

```bash
git clone https://github.com/your-username/reply-ease-ai.git
cd reply-ease-ai
```

---

### 2. Thiết lập Backend (FastAPI)

1. **Di chuyển vào thư mục backend**:
   ```bash
   cd backend
   ```

2. **Tạo và kích hoạt môi trường ảo Python**:
   - **Trên Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **Trên Linux / macOS**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Cài đặt các gói phụ thuộc**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Cấu hình biến môi trường**:
   ```bash
   cp .env.example .env
   ```
   Cập nhật thông tin kết nối PostgreSQL, Gemini API Key và Pinecone vào tệp `.env`:
   ```ini
   DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/reply_ease_ai"
   GEMINI_API_KEY="khoa-gemini-api-cua-ban"
   PINECONE_API_KEY="khoa-pinecone-api-cua-ban"
   PINECONE_INDEX_NAME="reply-ease-ai"
   PINECONE_ENVIRONMENT="us-east-1"
   SECRET_KEY="khoa-bi-mat-jwt-an-toan"
   ```

5. **Chạy Migration để tạo cấu trúc cơ sở dữ liệu**:
   ```bash
   alembic upgrade head
   ```

6. **(Tùy chọn) Nạp Dữ liệu Mẫu (20 Sản phẩm, FAQs, Cuộc hội thoại mẫu)**:
   ```bash
   python scripts/seed_data.py
   ```

7. **Khởi chạy Backend Server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   * Máy chủ API sẽ chạy tại: `http://localhost:8000`
   * Tài liệu tương tác Swagger UI: `http://localhost:8000/docs`
   * Tài liệu ReDoc: `http://localhost:8000/redoc`

---

### 3. Thiết lập Frontend (Next.js 16)

1. **Mở một cửa sổ dòng lệnh mới và truy cập vào thư mục frontend**:
   ```bash
   cd frontend
   ```

2. **Cài đặt các thư viện npm**:
   ```bash
   npm install
   # hoặc: pnpm install / yarn install
   ```

3. **Cấu hình biến môi trường**:
   ```bash
   cp .env.local.example .env.local
   ```
   Kiểm tra tệp `.env.local` kết nối đến Backend:
   ```ini
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

4. **Khởi chạy máy chủ phát triển Next.js**:
   ```bash
   npm run dev
   ```
   * Mở trình duyệt web và truy cập: `http://localhost:3000`

---

## ⚙️ Bảng Biến Môi Trường Chi Tiết

### Cấu hình Backend (`backend/.env`)

| Biến | Mục đích | Giá trị Mẫu |
|---|---|---|
| `PROJECT_NAME` | Tên định danh ứng dụng | `"Reply-Ease-AI API"` |
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL asyncpg | `postgresql+asyncpg://user:pass@localhost:5432/reply_ease_ai` |
| `SECRET_KEY` | Chuỗi bí mật tạo chữ ký JWT | Chuỗi ngẫu nhiên bảo mật |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Thời hạn của Access Token | `1440` (24 giờ) |
| `GEMINI_API_KEY` | Khóa API từ Google AI Studio | `AIzaSy...` |
| `GEMINI_MODEL` | Mô hình LLM chính trả lời tin nhắn | `gemini-3.1-flash-lite` |
| `GEMINI_EMBEDDING_MODEL` | Mô hình tạo vector tri thức RAG | `gemini-embedding-001` |
| `PINECONE_API_KEY` | Khóa API cơ sở dữ liệu Vector Pinecone | `pcsk_...` |
| `PINECONE_INDEX_NAME` | Tên Index lưu trữ trên Pinecone | `reply-ease-ai` |
| `SEPAY_MERCHANT_ID` | Mã định danh đơn vị bán hàng SePay | `YOUR_MERCHANT_ID` |
| `SEPAY_SECRET_KEY` | Khóa bí mật API SePay | `YOUR_SECRET_KEY` |
| `SEPAY_WEBHOOK_API_KEY` | Khóa xác thực Webhook gửi từ SePay | `YOUR_WEBHOOK_KEY` |
| `SMTP_HOST` | Máy chủ gửi thư điện tử SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Cổng kết nối SMTP | `465` |
| `SMTP_USER` | Email người gửi thông báo | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Mật khẩu ứng dụng của hòm thư | `app-specific-password` |
| `CLOUDINARY_URL` | Chuỗi kết nối dịch vụ Cloudinary | `cloudinary://key:secret@cloud` |

### Cấu hình Frontend (`frontend/.env.local`)

| Biến | Mục đích | Giá trị Mẫu |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Địa chỉ gốc của REST API | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Địa chỉ gốc của giao diện Web | `http://localhost:3000` |
| `NEXT_PUBLIC_WS_URL` | Địa chỉ máy chủ WebSocket | `ws://localhost:8000` |
| `NEXT_PUBLIC_SEPAY_MERCHANT_ID` | Merchant ID SePay cho Frontend | `YOUR_MERCHANT_ID` |

---

## 🧩 Hướng dẫn Tích hợp Widget vào Website

Bạn có thể tích hợp chatbot ReplyEase AI vào bất kỳ trang web nào chỉ với một đoạn mã ngắn:

### Cách 1: Sử dụng Thẻ Script Tự Động (Khuyên Dùng)

Chèn đoạn mã sau vào trước thẻ đóng `</body>` của website bạn muốn tích hợp:

```html
<!-- ReplyEase AI Chatbot Widget -->
<script
  src="https://domain-cua-ban.com/widget.js"
  data-domain-id="MA_DOMAIN_CUA_BAN"
  defer
></script>
```

### Cách 2: Nhúng Trực Tiếp Bằng Thẻ Iframe

```html
<!-- ReplyEase AI Direct Iframe -->
<iframe
  src="https://domain-cua-ban.com/chatbot?domain_id=MA_DOMAIN_CUA_BAN"
  width="450"
  height="670"
  frameborder="0"
  style="border: none; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.15);"
  title="Trợ lý Trực tuyến ReplyEase AI"
></iframe>
```

---

## 📡 Danh mục API Endpoints Chính

Hệ thống FastAPI cung cấp đầy đủ các nhóm API phục vụ mọi nghiệp vụ:

| Nhóm API | Tiền tố Route | Chức năng Chính |
|---|---|---|
| **Xác thực (Auth)** | `/api/v1/auth` | Đăng ký, đăng nhập, làm mới phiên truy cập (refresh token), quên mật khẩu |
| **Quản lý Domain** | `/api/v1/domains` | Thêm domain, cài đặt giao diện bot, cấu hình nguồn gốc truy cập cho phép |
| **Huấn luyện AI** | `/api/v1/domains` | Quản lý FAQ HelpDesk, câu hỏi sàng lọc khách hàng, tải tài liệu & đồng bộ RAG |
| **Sản phẩm & Dịch vụ** | `/api/v1/domains` | Quản lý danh mục hàng hóa, giá bán, ảnh chụp sản phẩm |
| **Chatbot Public** | `/api/v1/chatbot` | Phiên trò chuyện cho khách truy cập, hỏi đáp AI, thu thập thông tin email |
| **Hội thoại Trực tiếp** | `/api/v1/conversations` | Lịch sử chat, tiếp quản hội thoại (Human Takeover), gắn cờ hoàn thành |
| **WebSockets Real-time** | `/ws/chat/{room_id}` | Kênh truyền tin hai chiều tức thời giữa khách và nhân viên |
| **Customer Portal** | `/api/v1/portal` | Khách tự tra cứu lịch hẹn khả dụng, đặt lịch và thanh toán đơn hàng |
| **Thanh toán SePay** | `/api/v1/payments` | Tạo hóa đơn VietQR, tiếp nhận Webhook ngân hàng, kích hoạt gói cước SaaS |
| **Email Marketing** | `/api/v1/marketing` | Tạo và gửi chiến dịch thư điện tử tự động đến khách hàng tiềm năng |
| **Bảng Thống kê** | `/api/v1/dashboard` | Thống kê số lượng khách, tỷ lệ chuyển đổi, báo cáo doanh thu |
| **Tải lên Tệp tin** | `/api/v1/uploads` | Tải lên tài liệu hướng dẫn và lưu trữ hình ảnh sản phẩm/avatar |

---

## 🧪 Kiểm thử Tự động (Testing)

Khởi chạy bộ kiểm thử tự động của Backend với `pytest`:

```bash
cd backend
pytest -v
```

---

## 📄 Giấy phép (License)

Dự án được phân phối dưới giấy phép **MIT License** - xem thêm tại tệp [LICENSE](LICENSE).

<div align="center">
  <sub>Phát triển với ❤️ bởi đội ngũ ReplyEase AI</sub>
</div>

