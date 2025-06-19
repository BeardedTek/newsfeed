from fastapi import APIRouter, Depends, HTTPException
from app.auth.casdoor_sdk import require_role
import os
import httpx
import time
import xml.etree.ElementTree as ET
from fastapi.responses import Response
from app.freshrss_api_ext import FreshRSSAPIExt
import traceback
from app.workers.tasks import process_articles, enrich_articles
from app.models.database import Article
from sqlalchemy.orm import Session
from app.database import get_db
import datetime
from urllib.parse import unquote

router = APIRouter()

CASDOOR_ENDPOINT = os.getenv("CASDOOR_ENDPOINT")
CASDOOR_CLIENT_ID = os.getenv("CASDOOR_CLIENT_ID")
CASDOOR_CLIENT_SECRET = os.getenv("CASDOOR_CLIENT_SECRET")
CASDOOR_ORG = os.getenv("CASDOOR_ORG")
CASDOOR_APP_NAME = os.getenv("CASDOOR_APP_NAME")
CASDOOR_ADMIN_USERNAME = os.getenv("CASDOOR_ADMIN_USERNAME")
CASDOOR_ADMIN_PASSWORD = os.getenv("CASDOOR_ADMIN_PASSWORD")

FRESHRSS_API_HOST = os.getenv("FRESHRSS_API_HOST")
FRESHRSS_API_USER = os.getenv("FRESHRSS_API_USERNAME")
FRESHRSS_API_PASSWORD = os.getenv("FRESHRSS_API_PASSWORD")

_casdoor_token_cache = {"token": None, "expires_at": 0}

@router.get("/ping", summary="Admin ping endpoint (protected)")
def admin_ping(user=Depends(require_role(["admin", "poweruser"]))):
    return {"message": f"Hello, {user.get('name', user.get('sub', 'user'))}! You have admin access."}

# --- Category Management ---
@router.post("/categories/", summary="Add a category (admin)")
def add_category(user=Depends(require_role(["admin", "poweruser"]))):
    return {"message": "Add category (placeholder)"}

@router.put("/categories/{id}", summary="Edit/rename a category (admin)")
def edit_category(id: int, user=Depends(require_role(["admin", "poweruser"]))):
    return {"message": f"Edit category {id} (placeholder)"}

@router.delete("/categories/{id}", summary="Delete a category (admin)")
def delete_category(id: int, user=Depends(require_role(["admin", "poweruser"]))):
    return {"message": f"Delete category {id} (placeholder)"}

# --- Source Management ---
@router.post("/sources/", summary="Add a source (admin)")
def add_source(user=Depends(require_role(["admin", "poweruser"]))):
    return {"message": "Add source (placeholder)"}

@router.put("/sources/{id}", summary="Edit a source (admin)")
def edit_source(id: int, user=Depends(require_role(["admin", "poweruser"]))):
    return {"message": f"Edit source {id} (placeholder)"}

@router.delete("/sources/{id}", summary="Delete a source (admin)")
def delete_source(id: int, user=Depends(require_role(["admin", "poweruser"]))):
    return {"message": f"Delete source {id} (placeholder)"}

# --- Rebuild Operations ---
@router.post("/categories/rebuild", summary="Rebuild categories for all sources (admin)")
def rebuild_categories_all(user=Depends(require_role(["admin", "poweruser"]))):
    return {"message": "Rebuild categories for all sources (placeholder)"}

@router.post("/categories/rebuild/{source_id}", summary="Rebuild categories for a specific source (admin)")
def rebuild_categories_source(source_id: int, user=Depends(require_role(["admin", "poweruser"]))):
    return {"message": f"Rebuild categories for source {source_id} (placeholder)"}

@router.post("/related/rebuild", summary="Rebuild related articles (admin)")
def rebuild_related(user=Depends(require_role(["admin", "poweruser"]))):
    return {"message": "Rebuild related articles (placeholder)"}

# --- Settings Management ---
@router.get("/settings/", summary="Get settings (admin)")
def get_settings(user=Depends(require_role(["admin", "poweruser"]))):
    return {"settings": {}}  # Placeholder

@router.put("/settings/", summary="Update settings (admin)")
def update_settings(user=Depends(require_role(["admin", "poweruser"]))):
    return {"message": "Update settings (placeholder)"}



def get_freshrss_client() -> FreshRSSAPIExt:
    try:
        client = FreshRSSAPIExt(verbose=False)  # Uses env vars
        return client
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to initialize FreshRSS client")

# --- Sources Management ---
@router.get("/sources/", summary="List sources (admin)")
def list_sources(user=Depends(require_role(["admin", "poweruser"]))):
    try:
        client = get_freshrss_client()
        feeds_response = client.get_feeds()
        feeds = feeds_response.get('feeds', [])
        sources = [
            {
                'id': str(feed.get('id', '')),
                'title': feed.get('title', ''),
                'description': '',  # FreshRSS API may not provide description
                'website-url': feed.get('site_url', ''),
                'feed-url': feed.get('url', ''),
                'category': '',  # You can extract from feeds_groups if needed
            }
            for feed in feeds
        ]
        return sources
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load sources: {e}")

@router.post("/sources/{feed_id}/refresh", summary="Refresh a feed (admin)")
def refresh_source(feed_id: str, user=Depends(require_role(["admin", "poweruser"]))):
    client = get_freshrss_client()
    client.refresh_feed(feed_id)
    return {"status": "ok", "message": f"Feed '{feed_id}' refreshed."}

@router.post("/sources/{title}/clear", summary="Clear feed cache (admin)")
def clear_source_cache(title: str, user=Depends(require_role(["admin", "poweruser"]))):
    client = get_freshrss_client()
    client.clear_feed_cache(title)  # Adjust to actual method name if needed
    return {"status": "ok", "message": f"Cache for feed '{title}' cleared."}

@router.get("/sources/export", summary="Export all sources as OPML (admin)")
def export_sources(user=Depends(require_role(["admin", "poweruser"]))):
    client = get_freshrss_client()
    # Get all feeds
    feeds_response = client.get_feeds()
    feeds = feeds_response.get('feeds', [])
    
    # Create OPML content with all feeds
    opml_content = """<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>FreshRSS Feeds Export</title>
  </head>
  <body>"""
    
    for feed in feeds:
        opml_content += f"""
    <outline type="rss" text="{feed.get('title')}" xmlUrl="{feed.get('url')}" htmlUrl="{feed.get('site_url')}"/>"""
    
    opml_content += """
  </body>
</opml>"""
    
    return Response(
        content=opml_content,
        media_type="application/xml",
        headers={
            "Content-Disposition": 'attachment; filename="freshrss_feeds.opml"'
        }
    )

@router.get("/sources/export/{title}", summary="Export a source as OPML (admin)")
def export_source(title: str, user=Depends(require_role(["admin", "poweruser"]))):
    client = get_freshrss_client()
    # Get the feed details first
    feeds = client.get_feeds()
    feed = next((f for f in feeds.get('feeds', []) if f.get('title') == title), None)
    if not feed:
        raise HTTPException(status_code=404, detail=f"Feed '{title}' not found")
    
    # Create OPML content
    opml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>FreshRSS Feed Export</title>
  </head>
  <body>
    <outline type="rss" text="{feed.get('title')}" xmlUrl="{feed.get('url')}" htmlUrl="{feed.get('site_url')}"/>
  </body>
</opml>"""
    
    return Response(
        content=opml_content,
        media_type="application/xml",
        headers={
            "Content-Disposition": f'attachment; filename="{title}.opml"'
        }
    )

@router.post("/workers/process-articles", summary="Trigger article processing worker (admin)")
def trigger_process_articles(user=Depends(require_role(["admin", "poweruser"]))):
    result = process_articles.delay()
    return {"status": "ok", "message": "Article processing task triggered.", "task_id": result.id}

@router.post("/workers/enrich-articles", summary="Trigger article enrichment worker (admin)")
def trigger_enrich_articles(user=Depends(require_role(["admin", "poweruser"]))):
    result = enrich_articles.delay()
    return {"status": "ok", "message": "Article enrichment task triggered.", "task_id": result.id}

@router.get("/sources/stats", summary="Get sources stats (admin)")
def get_sources_stats(user=Depends(require_role(["admin", "poweruser"])), db: Session = Depends(get_db)):
    client = get_freshrss_client()
    feeds_response = client.get_feeds()
    feeds = feeds_response.get('feeds', []) if isinstance(feeds_response, dict) else feeds_response
    sources_stats = {}
    total_count = 0
    last_refresh = None
    for feed in feeds:
        feed_url = feed.get('url')
        if not feed_url:
            continue
        count = db.query(Article).filter(Article.source_url == feed_url).count()
        sources_stats[feed_url] = {"count": count}
        total_count += count
        last_article = db.query(Article).filter(Article.source_url == feed_url).order_by(Article.published_at.desc()).first()
        if last_article and last_article.published_at:
            if not last_refresh or last_article.published_at > last_refresh:
                last_refresh = last_article.published_at
    return {
        "newsfeed_article_count": total_count,
        "last_refresh": last_refresh.isoformat() if last_refresh else None,
        "sources": sources_stats
    }

@router.get("/sources/{feed_id}/count", summary="Get article count for a source (admin)")
def get_source_article_count(feed_id: str, user=Depends(require_role(["admin", "poweruser"])), db: Session = Depends(get_db)):
    client = get_freshrss_client()
    feeds_response = client.get_feeds()
    feeds = feeds_response.get('feeds', []) if isinstance(feeds_response, dict) else feeds_response
    feed = next((f for f in feeds if str(f.get('id')) == str(feed_id)), None)
    if not feed:
        return {"count": 0}
    feed_url = feed.get('url')
    if not feed_url:
        return {"count": 0}
    count = db.query(Article).filter(Article.source_url == feed_url).count()
    return {"count": count}

@router.get("/sources/stats/{feed_url}", summary="Get article count and last refresh for a source (admin)")
def get_source_stats(feed_url: str, user=Depends(require_role(["admin", "poweruser"])), db: Session = Depends(get_db)):
    # Unquote in case the frontend URL-encodes the feed_url
    feed_url = unquote(feed_url)
    count = db.query(Article).filter(Article.source_url == feed_url).count()
    last_article = db.query(Article).filter(Article.source_url == feed_url).order_by(Article.published_at.desc()).first()
    last_refresh = last_article.published_at.isoformat() if last_article and last_article.published_at else None
    return {"count": count, "last_refresh": last_refresh} 