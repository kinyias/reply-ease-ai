<div align="center">

<img src="./assets/hero-banner.png" alt="ReplyEase AI Banner" width="100%" />

# ReplyEase AI
### Autonomous Sales, Booking & Customer Support Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash--Lite-4285F4.svg?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector%20DB-000000.svg?style=flat-square&logo=pinecone&logoColor=white)](https://www.pinecone.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

English &bull; [Tiếng Việt](README_VI.md)

</div>

---

## 📌 Overview

**ReplyEase AI** is a production-ready, full-stack AI SaaS platform designed to transform e-commerce and service businesses. It integrates **Retrieval-Augmented Generation (RAG)**, conversational AI powered by **Google Gemini**, real-time **WebSockets**, and an **embeddable website widget** to automate 24/7 sales consultations, customer inquiries, appointment bookings, and payment checkouts.

When complex inquiries arise, human agents can seamlessly intervene in real-time through an omnichannel live chat dashboard with zero interruption to the user experience.

---

## 📸 Visual Showcase

<div align="center">

### 1. Embeddable AI Chat Widget & Sales Assistant
*Clean customer-facing chatbot interface with live catalog, multilingual support, and automated lead capture.*

<img src="./assets/chat-widget.png" alt="ReplyEase AI Chat Widget" width="480px" />

---

### 2. Live Conversations & Human Agent Takeover
*Real-time omnichannel inbox with live WebSocket streaming, AI/Live mode toggling, and quick response suggestions.*

<img src="./assets/chat.png" alt="Live Conversations Dashboard" width="100%" />

---

### 3. AI Knowledge Training & RAG Document Ingestion
*Train bots using HelpDesk FAQs, customer qualification questions, and documents (PDF, Excel, TXT) synced with Pinecone Vector DB.*

<img src="./assets/rag.png" alt="AI Knowledge Training & RAG Dashboard" width="100%" />

</div>

---

## ✨ Key Features

### 🤖 1. Autonomous AI Sales & Support Engine
- **Powered by Google Gemini**: Leverages `gemini-3.1-flash-lite` for high-speed, cost-efficient, natural conversations, supported by automatic multi-model failover (`gemini-3.5-flash-lite`, `gemini-2.5-flash`, `gemini-3-flash`).
- **Context-Aware Responses**: Remembers customer dialogue history and maintains consistent brand personality.
- **Lead Qualification & Filtering**: Automatically asks customizable qualification questions (budget, size, preferences, timeline) and captures prospective lead emails.

### 📚 2. Multi-Format RAG Knowledge Training
- **Document Ingestion**: Upload documents in **PDF (`.pdf`)**, **Excel (`.xlsx`, `.xls`, `.csv`)**, and **Plain Text (`.txt`, `.md`)** up to 20MB.
- **Smart Semantic Chunking**: Automatically processes unstructured text and tables into semantically coherent chunks.
- **Vector Search with Pinecone**: Uses Google `gemini-embedding-001` to generate high-dimensional vectors stored in domain-isolated Pinecone namespaces.
- **HelpDesk & FAQs**: Built-in Q&A manager for instant lookup and accurate policy answers (returns, shipping, guarantees).

### 💬 3. Real-Time Conversations & Human-in-the-Loop Takeover
- **WebSocket Streaming**: Bi-directional real-time messaging between customers and admin agents.
- **Hybrid AI & Live Mode**: Toggle between autonomous AI handling and manual human agent takeover with a single click.
- **Agent Productivity Tools**: Canned message suggestions, urgent flags, unread filters, and customer qualification badges.

### 🛍️ 4. In-Chat Product Showcase & Appointments
- **Visual Product Catalog**: Displays products with live pricing, photos, and descriptions directly inside the chat interface.
- **Appointment Scheduling**: Integrated calendar slot booking directly through the chatbot widget.
- **Dedicated Customer Portal**: Secure booking management and order checkout links.

### 💳 5. SePay & VietQR Dynamic Payments
- **VietQR Dynamic Codes**: Automatically generates instant bank transfer QR codes containing exact order amounts and references.
- **Automated Webhook Processing**: Integrates with **SePay** to verify incoming payments within seconds, triggering instant order fulfillment and SaaS subscription tier upgrades.

### 🧩 6. Lightweight Embeddable Chat Widget
- **Plug & Play**: Single `<script>` tag or `<iframe>` embed code to add to any website (Shopify, WordPress, WooCommerce, custom HTML/React).
- **Customizable Appearance**: Change primary colors, bot avatar, header titles, and greeting messages from the dashboard.
- **Built-in Internationalization**: Full English and Vietnamese language switching out of the box.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend & Client Interfaces"]
        Widget["Web Chatbot Widget<br/>(widget.js / iframe)"]
        Dashboard["Next.js 16 Dashboard<br/>(App Router, React 19, Tailwind)"]
        Portal["Customer Portal<br/>(Appointments & Checkout)"]
    end

    subgraph Backend["FastAPI Application Server"]
        Router["API Gateway / Router"]
        WS["WebSocket Manager<br/>(Real-Time Chat Streaming)"]
        AuthSvc["Auth & JWT Service"]
        AIBotSvc["AI Bot & Sales Engine"]
        RAGSvc["Document Parser & RAG Pipeline"]
        PaySvc["SePay & VietQR Webhook Handler"]
    end

    subgraph Storage["Databases & External AI Services"]
        PG[("PostgreSQL Database<br/>(Users, Domains, Chats, Orders)")]
        Pinecone[("Pinecone Vector DB<br/>(Domain Knowledge Embeddings)")]
        Gemini["Google Gemini AI<br/>(Flash-Lite & Embeddings API)"]
        SePay["SePay Payment Gateway<br/>(VietQR Settlement)"]
        Cloudinary["Cloudinary / Local Storage<br/>(Media & Uploads)"]
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

    AIBotSvc <-->|Similarity Search| Pinecone
    AIBotSvc <-->|Prompt & Completions| Gemini
    RAGSvc -->|Generate Embeddings| Gemini
    RAGSvc -->|Upsert Chunks| Pinecone

    AuthSvc --> PG
    AIBotSvc --> PG
    PaySvc <-->|Webhook Notification| SePay
    PaySvc --> PG
    RAGSvc --> Cloudinary
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/) / [Shadcn UI](https://ui.shadcn.com/), [TanStack Query v5](https://tanstack.com/query), [Zustand](https://zustand-demo.pmnd.rs/), [Recharts](https://recharts.org/), [Lucide Icons](https://lucide.dev/) |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/), [Python 3.11+](https://www.python.org/), [Uvicorn](https://www.uvicorn.org/), [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async with `asyncpg`), [Alembic](https://alembic.sqlalchemy.org/), [Pydantic v2](https://docs.pydantic.dev/), [WebSockets](https://websockets.readthedocs.io/) |
| **AI & Vector DB** | [Google Generative AI SDK](https://ai.google.dev/) (`gemini-3.1-flash-lite`, `gemini-embedding-001`), [Pinecone Client v5](https://www.pinecone.io/) |
| **Database & Cache** | [PostgreSQL 15+](https://www.postgresql.org/) with relational schema and connection pooling |
| **Payment Gateway** | [SePay](https://sepay.vn/) (Automated VietQR bank transfer detection via webhooks) |
| **Storage & Parsing**| [Cloudinary](https://cloudinary.com/), `pypdf` (PDF extraction), `openpyxl` (Excel processing) |
| **Security & Auth** | JWT (`python-jose`), `passlib` with `bcrypt`, CORS protection, domain isolation |

---

## 📁 Repository Structure

```text
reply-ease-ai/
├── assets/                     # Screenshots and visual banners for documentation
│   ├── chat-widget.png         # Chat widget interface screenshot
│   ├── chat.png                # Live conversations management screenshot
│   ├── hero-banner.png         # Main application banner
│   └── rag.png                 # RAG document training dashboard screenshot
├── backend/                    # FastAPI Backend Application
│   ├── alembic/                # Database migrations
│   ├── app/
│   │   ├── api/v1/             # REST & WebSocket endpoints
│   │   │   └── endpoints/      # Auth, Chatbot, Domains, Payments, Products, Training, etc.
│   │   ├── core/               # Configuration, security, database session setup
│   │   ├── models/             # SQLAlchemy ORM models (User, Domain, ChatRoom, Product, etc.)
│   │   ├── schemas/            # Pydantic request/response validation schemas
│   │   ├── services/           # Business logic (Gemini, Vector DB, RAG, Email, SePay)
│   │   └── main.py             # FastAPI entrypoint and lifespan lifecycle
│   ├── scripts/                # Database verification, data seeding, and utility scripts
│   ├── tests/                  # Pytest test suite
│   ├── .env.example            # Backend environment variables template
│   └── requirements.txt        # Python package dependencies
└── frontend/                   # Next.js 16 Client Application
    ├── app/                    # Next.js App Router
    │   ├── (dashboard)/        # Admin dashboard pages (Conversations, Training, Settings, Billing)
    │   ├── auth/               # Sign-in, Sign-up, Forgot Password pages
    │   ├── chatbot/            # Standalone and iframe-embeddable chatbot page
    │   └── portal/             # Customer booking & checkout portal
    ├── components/             # Reusable UI & business components (Shadcn + custom)
    ├── context/                # React context providers (i18n, Theme, Auth)
    ├── lib/                    # Utilities, API client (axios), and translation dictionaries (en, vi)
    ├── public/                 # Static assets and widget.js embed loader
    ├── .env.local.example      # Frontend environment variables template
    └── package.json            # Node.js dependencies and build scripts
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have installed:
- **Node.js** >= 20.x
- **Python** >= 3.11
- **PostgreSQL** >= 14
- Accounts/API keys for:
  - [Google AI Studio](https://aistudio.google.com/) (Gemini API Key)
  - [Pinecone](https://www.pinecone.io/) (Pinecone API Key & Index)
  - [SePay](https://sepay.vn/) (Merchant ID & Secret Key - optional for mock payments)
  - [Cloudinary](https://cloudinary.com/) (Optional for cloud media uploads)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/reply-ease-ai.git
cd reply-ease-ai
```

---

### 2. Backend Setup (FastAPI)

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in your PostgreSQL connection string, Google Gemini API key, and Pinecone credentials in `.env`:
   ```ini
   DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/reply_ease_ai"
   GEMINI_API_KEY="your-gemini-api-key"
   PINECONE_API_KEY="your-pinecone-api-key"
   PINECONE_INDEX_NAME="reply-ease-ai"
   PINECONE_ENVIRONMENT="us-east-1"
   SECRET_KEY="your-super-secret-jwt-key"
   ```

5. **Run Database Migrations**:
   ```bash
   alembic upgrade head
   ```

6. **(Optional) Seed Sample Products, FAQs & Test Data**:
   ```bash
   python scripts/seed_data.py
   ```

7. **Start the FastAPI Development Server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   * The API server will be live at `http://localhost:8000`
   * Interactive Swagger API documentation: `http://localhost:8000/docs`
   * Redoc documentation: `http://localhost:8000/redoc`

---

### 3. Frontend Setup (Next.js 16)

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or: pnpm install / yarn install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   Verify that `.env.local` points to your backend instance:
   ```ini
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

4. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```
   * Open your browser at: `http://localhost:3000`

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `PROJECT_NAME` | Name of the application | `"Reply-Ease-AI API"` |
| `DATABASE_URL` | PostgreSQL asyncpg connection string | `postgresql+asyncpg://user:pass@localhost:5432/reply_ease_ai` |
| `SECRET_KEY` | Secret key for signing JWT tokens | Random string |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | `1440` (24 hours) |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `GEMINI_MODEL` | Primary LLM model for bot replies | `gemini-3.1-flash-lite` |
| `GEMINI_EMBEDDING_MODEL` | Embedding model for RAG | `gemini-embedding-001` |
| `PINECONE_API_KEY` | Pinecone API key | `pcsk_...` |
| `PINECONE_INDEX_NAME` | Pinecone vector index name | `reply-ease-ai` |
| `SEPAY_MERCHANT_ID` | SePay Merchant ID | `YOUR_MERCHANT_ID` |
| `SEPAY_SECRET_KEY` | SePay API Secret key | `YOUR_SECRET_KEY` |
| `SEPAY_WEBHOOK_API_KEY` | Secret API key to authenticate SePay webhooks | `YOUR_WEBHOOK_KEY` |
| `SMTP_HOST` | SMTP server host for sending emails | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `465` |
| `SMTP_USER` | SMTP username / sender email | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP app password | `app-specific-password` |
| `CLOUDINARY_URL` | Cloudinary connection string (optional) | `cloudinary://key:secret@cloud` |

### Frontend Configuration (`frontend/.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of backend REST API | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Base URL of frontend application | `http://localhost:3000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket base URL | `ws://localhost:8000` |
| `NEXT_PUBLIC_SEPAY_MERCHANT_ID` | SePay Merchant ID | `YOUR_MERCHANT_ID` |

---

## 🧩 Website Widget Integration

Adding ReplyEase AI to any third-party website or e-commerce shop requires only a single code snippet:

### Method 1: Embedded Script (Recommended)

Paste this script snippet before the closing `</body>` tag of your website:

```html
<!-- ReplyEase AI Chatbot Widget -->
<script
  src="https://your-domain.com/widget.js"
  data-domain-id="YOUR_DOMAIN_ID"
  defer
></script>
```

### Method 2: Direct Iframe Embed

```html
<!-- ReplyEase AI Direct Iframe -->
<iframe
  src="https://your-domain.com/chatbot?domain_id=YOUR_DOMAIN_ID"
  width="450"
  height="670"
  frameborder="0"
  style="border: none; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.15);"
  title="ReplyEase AI Assistant"
></iframe>
```

---

## 📡 API Endpoints Overview

The FastAPI backend exposes comprehensive RESTful and WebSocket endpoints:

| Module | Route Prefix | Key Functionalities |
|---|---|---|
| **Authentication** | `/api/v1/auth` | User registration, login, token refresh, forgot-password |
| **Domains** | `/api/v1/domains` | Domain CRUD, chatbot branding settings, allowed origins |
| **Bot Training** | `/api/v1/domains` | HelpDesk FAQs, qualification filter questions, document upload & RAG training |
| **Products** | `/api/v1/domains` | Product catalog CRUD, image uploads, price management |
| **Public Chatbot** | `/api/v1/chatbot` | Public bot chat session, message processing, lead email collection |
| **Conversations** | `/api/v1/conversations` | Conversation history, agent takeover, mark as resolved |
| **WebSockets** | `/ws/chat/{room_id}` | Live bi-directional chat streaming for agents and visitors |
| **Customer Portal** | `/api/v1/portal` | Public appointment slot lookup, bookings, and product orders |
| **Payments** | `/api/v1/payments` | VietQR invoice generation, SePay webhook listener, plan upgrades |
| **Marketing** | `/api/v1/marketing` | Email campaign management, broadcast delivery |
| **Dashboard** | `/api/v1/dashboard` | Aggregated analytics, leads, conversation metrics |
| **File Uploads** | `/api/v1/uploads` | Document parsing & image upload endpoints |

---

## 🧪 Testing

Run automated tests on the backend using `pytest`:

```bash
cd backend
pytest -v
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Built with ❤️ by the ReplyEase AI Team</sub>
</div>

