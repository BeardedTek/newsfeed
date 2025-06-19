# app/api/articles.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any
from app.database import get_db
from app.models.database import Article, Category
from app.models.article import Article as ArticleSchema
from app.freshrss_api_ext import FreshRSSAPIExt
from app.caching import cache_response
from app.services.article import ArticleService
from app.services.freshrss import FreshRSSService
from app.config import get_settings
# hashlib is no longer needed here as it's used within the decorator
from urllib.parse import urlparse # Import urlparse

router = APIRouter()

settings = get_settings()

# Define default cache expiration times for clarity, use them in the decorator
ARTICLE_LIST_CACHE_EXPIRE = 60 # Cache article lists for 60 seconds
SINGLE_ARTICLE_CACHE_EXPIRE = 300 # Cache single articles for 300 seconds (5 minutes)

def get_freshrss_client() -> FreshRSSAPIExt:
    """Create and return a FreshRSS API client instance using environment variables."""
    try:
        client = FreshRSSAPIExt(verbose=False)  # Uses env vars
        return client
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to initialize FreshRSS client")

def get_google_favicon_url(source_url: str, size: int = 128) -> str:
    """Generates a Google Favicon service URL for a given source URL."""
    if not source_url:
        # Fallback to a generic default if source_url is empty
        return "/favicon.svg" # Or handle as an error case

    try:
        # Parse the URL to get the domain (netloc)
        parsed_url = urlparse(source_url)
        # Construct the base URL (scheme + netloc)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        # Construct the Google Favicon URL
        return f"https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url={base_url}&size={size}"
    except Exception as e:
        # Log the error and return a default or handle appropriately
        print(f"Error generating Google favicon URL for {source_url}: {e}")
        return "/favicon.svg" # Fallback in case of parsing error


@router.get("")
@router.get("/")
@cache_response(expire_seconds=settings.article_list_cache_expire)
async def get_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: str = None,
    source: str = None,
    search: str = None,
    db: Session = Depends(get_db)
):
    """
    Get articles with optional filtering.
    
    - **skip**: Number of articles to skip for pagination
    - **limit**: Maximum number of articles to return
    - **category**: Filter by category name
    - **source**: Filter by source name
    - **search**: Search in title and description
    """
    return ArticleService.get_articles(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        source=source,
        search=search
    )

@router.get("/{article_id}")
@cache_response(expire_seconds=settings.single_article_cache_expire)
async def get_article(article_id: int, db: Session = Depends(get_db)):
    """
    Get a single article by ID.
    
    - **article_id**: ID of the article to retrieve
    """
    # First try to get from database
    article_data = ArticleService.get_article_by_id(db, article_id)

    if not article_data:
        # If not in database, try to fetch directly from FreshRSS
        try:
            client = FreshRSSService.get_client()
            article_data = ArticleService.get_article_from_freshrss(article_id, client)
            
            if not article_data:
                raise HTTPException(status_code=404, detail="Article not found")
                
            return article_data
        except Exception as e:
            # Still raise 404 if FreshRSS also doesn't have it
            raise HTTPException(status_code=404, detail="Article not found")

    return article_data