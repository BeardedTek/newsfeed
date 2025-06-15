from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.api import articles, categories, related, thumbnails, sources
from app.api import admin
from app.api import auth
from app.init_db import init_db

app = FastAPI(title="NewsFeed Backend API")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a main API router with prefix /api
api_router = APIRouter(prefix="/api")
api_router.include_router(articles.router, prefix="/articles", tags=["articles"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(related.router, prefix="/related", tags=["related"])
api_router.include_router(thumbnails.router, prefix="/thumbnails", tags=["thumbnails"])
api_router.include_router(sources.router, prefix="/sources", tags=["sources"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

@api_router.get("/")
async def root():
    return {"status": "ok"}

app.include_router(api_router) 