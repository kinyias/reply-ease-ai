from fastapi import APIRouter
from app.api.v1.endpoints import auth

api_router = APIRouter()

# Authentication & User Management
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# In subsequent phases, we will include:
# api_router.include_router(domains.router, prefix="/domains", tags=["domains"])
# api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
# api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
# api_router.include_router(portal.router, prefix="/portal", tags=["portal"])
# api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
# api_router.include_router(marketing.router, prefix="/marketing", tags=["marketing"])
# api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
# api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])

