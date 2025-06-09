from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import articles, categories, related, thumbnails, sources
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

# Include routers
app.include_router(articles.router, prefix="/articles", tags=["articles"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])
app.include_router(related.router, prefix="/related", tags=["related"])
app.include_router(thumbnails.router, prefix="/thumbnails", tags=["thumbnails"])
app.include_router(sources.router, prefix="/sources", tags=["sources"])

@app.get("/")
async def root():
    return {"status": "ok"} 