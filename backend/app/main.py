import asyncio
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.router import api_router

logger = logging.getLogger(__name__)

async def run_prewarm():
    try:
        from app.core.database import AsyncSessionLocal
        from app.services import demo_session_service
        async with AsyncSessionLocal() as session:
            await demo_session_service.prewarm_master_embeddings(session)
    except Exception as e:
        logger.warning(f"Error in prewarm task: {e}")


async def run_startup_demo_cleanup():
    """One-time startup cleanup to purge expired demo sessions (> 30 mins) left over from previous runs."""
    try:
        from app.core.database import AsyncSessionLocal
        from app.services import demo_session_service
        async with AsyncSessionLocal() as session:
            count = await demo_session_service.cleanup_expired_demo_sessions(session)
            if count > 0:
                logger.info(f"Startup demo cleanup: successfully purged {count} expired demo sessions.")
            else:
                logger.info("Startup demo cleanup: no expired demo sessions found.")
    except Exception as e:
        logger.warning(f"Error in startup demo cleanup: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure static/uploads directory exists
    os.makedirs(os.path.join(settings.STATIC_DIR, "uploads"), exist_ok=True)
    asyncio.create_task(run_prewarm())
    asyncio.create_task(run_startup_demo_cleanup())
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files
os.makedirs(os.path.join(settings.STATIC_DIR, "uploads"), exist_ok=True)
app.mount(
    "/static",
    StaticFiles(directory=settings.STATIC_DIR),
    name="static"
)

# Register API v1 routes
app.include_router(api_router, prefix="/api/v1")

# Register direct WebSocket routes (ws://host:port/ws/chat/{room_id})
from app.api.v1.endpoints.websocket import router as websocket_router
app.include_router(websocket_router)

# Direct IPN Aliases (so any configured SePay URL path works seamlessly)
from app.api.v1.endpoints.payments import sepay_ipn_webhook_handler
app.add_api_route("/payment/ipn", sepay_ipn_webhook_handler, methods=["POST"], include_in_schema=False)
app.add_api_route("/payments/ipn", sepay_ipn_webhook_handler, methods=["POST"], include_in_schema=False)
app.add_api_route("/sepay/ipn", sepay_ipn_webhook_handler, methods=["POST"], include_in_schema=False)
app.add_api_route("/sepay/webhook", sepay_ipn_webhook_handler, methods=["POST"], include_in_schema=False)


@app.get("/", tags=["Health Check"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health Check"])
async def health_check():
    return {
        "status": "healthy",
        "service": "reply-ease-backend",
        "environment": settings.ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
