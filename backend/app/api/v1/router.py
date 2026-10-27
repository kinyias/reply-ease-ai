from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    chatbot,
    conversations,
    domains,
    products,
    training,
    websocket,
    portal,
    payments,
    marketing,
    dashboard,
)

api_router = APIRouter()

# Authentication & User Management
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Domain Management & Chatbot Settings
api_router.include_router(domains.router, prefix="/domains", tags=["Domains & Chatbots"])

# Bot Training: HelpDesk FAQ & Lead Qualifier Filter Questions
api_router.include_router(training.router, prefix="/domains", tags=["Bot Training"])

# Domain Products & Services Management
api_router.include_router(products.router, prefix="/domains", tags=["Products"])

# Public Chatbot & AI Sales Engine
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["Chatbot Public API"])

# Real-Time Conversations & Live Messenger
api_router.include_router(conversations.router, prefix="/conversations", tags=["Conversations"])

# Real-Time WebSockets
api_router.include_router(websocket.router, tags=["WebSocket"])

# Customer Portal (Appointments, Booking & Product Checkout)
api_router.include_router(portal.router, prefix="/portal", tags=["Customer Portal"])

# SePay Payments, VietQR Subscriptions & Merchant Integration
api_router.include_router(payments.router, prefix="/payments", tags=["Payments & SePay"])

# Email Marketing Campaigns & Lead Qualification
api_router.include_router(marketing.router, prefix="/marketing", tags=["Email Marketing"])

# Dashboard Metrics, Analytics & Reporting
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
# api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])

