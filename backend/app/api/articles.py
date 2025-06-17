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
# hashlib is no longer needed here as it's used within the decorator
from urllib.parse import urlparse # Import urlparse

router = APIRouter()

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
@cache_response(expire_seconds=ARTICLE_LIST_CACHE_EXPIRE) # Apply the cache decorator
async def get_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: str = None,
    source: str = None,
    search: str = None,
    db: Session = Depends(get_db) # db will be passed but not used for cache key by decorator
):
    # The caching logic is now handled by the decorator.
    # Keep the original function logic to fetch data when not in cache.

    # Build base query
    query = db.query(Article).filter(Article.is_processed == True)

    # Apply filters if provided
    if category:
        query = query.join(Article.categories).filter(Category.name.ilike(f"%{category}%"))
    if source:
        query = query.filter(Article.source_name.ilike(f"%{source}%"))
    if search:
        query = query.filter(
            (Article.title.ilike(f"%{search}%")) |
            (Article.description.ilike(f"%{search}%"))
        )

    # Get total count for pagination
    total = query.count()

    # Apply pagination and ordering
    articles = query.order_by(desc(Article.published_at)).offset(skip).limit(limit).all()

    # Format articles for response
    formatted_articles = []
    for article in articles:
        # Determine thumbnail_url according to user rules
        thumbnail_url = (
            article.thumbnail_url if article.thumbnail_url else (
                article.image_url if article.image_url else get_google_favicon_url(article.source_url) # Use Google Favicon as fallback
            )
        )
        formatted_article = {
            "id": str(article.id),
            "title": article.title,
            "summary": article.description,
            "published": int(article.published_at.timestamp()) if article.published_at else 0,
            "origin": article.source_name,
            "url": article.link,
            "categories": [cat.name for cat in article.categories],
            "related": [
                {"id": str(rel.id), "title": rel.title, "url": rel.link}
                for rel in article.related_articles
            ],
            "thumbnail_url": thumbnail_url
        }
        formatted_articles.append(formatted_article)

    response_data = {
        "articles": formatted_articles,
        "total": total,
        "skip": skip,
        "limit": limit
    }

    # The decorator will automatically set the cache with response_data
    return response_data

@router.get("/{article_id}")
@cache_response(expire_seconds=SINGLE_ARTICLE_CACHE_EXPIRE) # Apply the cache decorator
async def get_article(article_id: int, db: Session = Depends(get_db)): # db will be passed but not used for cache key
    # The caching logic is now handled by the decorator.
    # Keep the original function logic to fetch data when not in cache.

    # First try to get from database
    article = db.query(Article).filter(Article.id == article_id).first()

    if not article:
        # If not in database, try to fetch directly from FreshRSS
        try:
            client = get_freshrss_client()
            items_response = client.get_items_from_ids([article_id])
            items = items_response["items"] if isinstance(items_response, dict) and "items" in items_response else items_response
            if not items:
                raise HTTPException(status_code=404, detail="Article not found")
            item = items[0]

            # Determine thumbnail_url for FreshRSS item fallback
            item_thumbnail_url = (
                item.get("enclosure_url") if item.get("enclosure_url") else (
                    item.get("image_url") if item.get("image_url") else get_google_favicon_url(item.get("origin", {}).get("htmlUrl", "")) # Use Google Favicon
                )
            )

            response_data = {
                "article": {
                    "id": str(item["id"]),
                    "title": item["title"],
                    "summary": {"content": item["content"]},
                    "content": item["content"],
                    "published": int(item["created_on_time"]),
                    "origin": item.get("author"),
                    "url": item["url"],
                    "categories": item.get("categories", []),
                    "related": [],
                    "thumbnail_url": item_thumbnail_url,
                    "image_url": item.get("enclosure_url", "") # Keep original image_url if available
                }
            }
            # The decorator will automatically set the cache with response_data
            return response_data
        except Exception as e:
            # Still raise 404 if FreshRSS also doesn't have it
            raise HTTPException(status_code=404, detail="Article not found")

    # Single article endpoint
    # Determine thumbnail_url according to user rules
    thumbnail_url = (
        article.thumbnail_url if article.thumbnail_url else (
            article.image_url if article.image_url else get_google_favicon_url(article.source_url) # Use Google Favicon as fallback
        )
    )
    return {
        "article": {
            "id": str(article.id),
            "title": article.title,
            "summary": article.description,
            "content": article.content,
            "published": int(article.published_at.timestamp()) if article.published_at else 0,
            "origin": article.source_name,
            "url": article.link,
            "categories": [cat.name for cat in article.categories],
            "related": [
                {"id": str(rel.id), "title": rel.title, "url": rel.link}
                for rel in article.related_articles
            ],
            "thumbnail_url": thumbnail_url
        }
    }