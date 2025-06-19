from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.api import articles, categories, related, thumbnails, sources
from app.api import admin
from app.api import auth
from app.api import user
from app.init_db import init_db
from app.logging_config import configure_logging
from app.config import get_settings

# Configure logging
configure_logging()

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="NewsFeed Backend API",
    description="API for the NewsFeed application",
    version="1.0.0",
    docs_url="/api/docs" if settings.debug else None,
    redoc_url="/api/redoc" if settings.debug else None,
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Add CORS middleware
allowed_origins = [
    "http://localhost:8880",
    "http://127.0.0.1:8880",
    "https://newsfeed.beardedtek.net"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a main API router with prefix /api
api_router = APIRouter(prefix=settings.api_prefix)

# Include all routers
api_router.include_router(articles.router, prefix="/articles", tags=["articles"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(related.router, prefix="/related", tags=["related"])
api_router.include_router(thumbnails.router, prefix="/thumbnails", tags=["thumbnails"])
api_router.include_router(sources.router, prefix="/sources", tags=["sources"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(user.router, prefix="/user", tags=["user"])

# Health check endpoints
@api_router.get("/", tags=["health"])
async def root():
    """API root endpoint."""
    return {"status": "ok"}

@api_router.get("/health", tags=["health"])
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}

# Include the API router in the app
app.include_router(api_router) 