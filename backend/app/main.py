import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure static/uploads directory exists
    os.makedirs(os.path.join(settings.STATIC_DIR, "uploads"), exist_ok=True)
    yield
    # Shutdown logic if needed


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
