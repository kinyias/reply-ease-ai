from fastapi import APIRouter
from app.api.v1.endpoints import auth, chatbot, domains, products, training

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
# api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
# api_router.include_router(portal.router, prefix="/portal", tags=["portal"])
# api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
# api_router.include_router(marketing.router, prefix="/marketing", tags=["marketing"])
# api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
# api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])

