from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import os
from typing import List, Dict
from app.database import get_db
from app.models.database import Article
from freshrss_api import FreshRSSAPI
from loguru import logger

router = APIRouter()

def get_freshrss_client() -> FreshRSSAPI:
    """Create and return a FreshRSS API client instance using environment variables."""
    try:
        # The client will automatically use the environment variables:
        # FRESHRSS_PYTHON_API_HOST
        # FRESHRSS_PYTHON_API_USERNAME
        # FRESHRSS_PYTHON_API_PASSWORD
        # FRESHRSS_PYTHON_API_VERIFY_SSL
        client = FreshRSSAPI(verbose=True)  # Enable logging for debugging
        return client
    except Exception as e:
        logger.error(f"Failed to initialize FreshRSS client: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initialize FreshRSS client")

@router.get("/")
async def get_sources():
    """Get all RSS sources from FreshRSS."""
    try:
        client = get_freshrss_client()
        feeds_response = client.get_feeds()
        feeds = feeds_response["feeds"] if isinstance(feeds_response, dict) and "feeds" in feeds_response else feeds_response
        sources = [
            {
                "id": str(feed["id"]),
                "title": feed["title"],
                "url": feed["url"],
                "icon": feed.get("favicon_id")
            }
            for feed in feeds
        ]
        return {"sources": sources}
    except Exception as e:
        logger.error(f"Failed to fetch feeds from FreshRSS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch feeds from FreshRSS: {str(e)}")

@router.get("/{source_id}/articles")
async def get_source_articles(source_id: str):
    """Get articles for a specific source from FreshRSS."""
    try:
        client = get_freshrss_client()
        # Get items for the specific feed
        items = client.get_items_from_ids([int(source_id)])
        articles = [
            {
                "id": str(item["id"]),
                "title": item["title"],
                "summary": {"content": item["content"]},
                "published": int(item["created_on_time"]),
                "origin": item.get("author"),
                "url": item["url"],
                "categories": item.get("categories", []),
                "related": [],
                "thumbnail_url": item.get("enclosure_url", "")
            }
            for item in items
        ]
        return {"articles": articles}
    except Exception as e:
        logger.error(f"Failed to fetch articles from FreshRSS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch articles from FreshRSS: {str(e)}") 