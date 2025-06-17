from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict
import os
from pathlib import Path
from app.database import get_db
from app.models.database import Article
from app.caching import cache_response # Import cache_response
from urllib.parse import urlparse # Import urlparse

router = APIRouter()

# Create thumbnail directory if it doesn't exist
THUMBNAIL_DIR = Path("thumbnails")
THUMBNAIL_DIR.mkdir(exist_ok=True)

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


@router.get("/{article_id}")
@cache_response(expire_seconds=300) # Cache single thumbnail URL for 5 minutes
async def get_thumbnail(article_id: int, db: Session = Depends(get_db)): # db is excluded from cache key
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    # Apply thumbnail_url logic
    thumbnail_url = (
        article.thumbnail_url if article.thumbnail_url else (
            article.image_url if article.image_url else get_google_favicon_url(article.source_url) # Use Google Favicon as fallback
        )
    )
    return {"thumbnail_url": thumbnail_url}

@router.post("/batch")
@cache_response(expire_seconds=300) # Cache batch thumbnail URLs for 5 minutes
async def batch_thumbnails(article_ids: List[int], db: Session = Depends(get_db)): # db is excluded from cache key
    if len(article_ids) > 20:
        raise HTTPException(status_code=400, detail="Batch size too large")
    results = {}
    for article_id in article_ids:
        article = db.query(Article).filter(Article.id == article_id).first()
        if article:
            thumbnail_url = (
                article.thumbnail_url if article.thumbnail_url else (
                    article.image_url if article.image_url else get_google_favicon_url(article.source_url) # Use Google Favicon as fallback
                )
            )
            results[str(article_id)] = thumbnail_url
    return results

# Thumbnail URLs are now included in the articles response
# This file is kept for future use if needed