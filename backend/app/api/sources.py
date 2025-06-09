from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import httpx
import os
from typing import List, Dict
from app.database import get_db
from app.models.database import Article

router = APIRouter()

@router.get("/")
async def get_sources():
    # Get FreshRSS credentials from environment
    freshrss_url = os.getenv('FRESHRSS_URL')
    freshrss_user = os.getenv('FRESHRSS_API_USER')
    freshrss_password = os.getenv('FRESHRSS_API_PASSWORD')

    if not all([freshrss_url, freshrss_user, freshrss_password]):
        raise HTTPException(status_code=500, detail="FreshRSS credentials not configured")

    # Login to get auth token
    async with httpx.AsyncClient() as client:
        login_url = f"{freshrss_url}/api/greader.php/accounts/ClientLogin"
        login_data = {
            "Email": freshrss_user,
            "Passwd": freshrss_password
        }
        login_res = await client.post(login_url, data=login_data)
        if login_res.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to login to FreshRSS")
        
        auth_token = login_res.text.split('Auth=')[1].strip()

        # Fetch subscriptions (sources)
        subscriptions_url = f"{freshrss_url}/api/greader.php/reader/api/0/subscription/list"
        headers = {"Authorization": f"GoogleLogin auth={auth_token}"}
        res = await client.get(subscriptions_url, headers=headers)
        
        if res.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch from FreshRSS")

        data = res.json()
        sources = []
        
        if "subscriptions" in data:
            for sub in data["subscriptions"]:
                source = {
                    "id": sub.get("id", ""),
                    "title": sub.get("title", ""),
                    "url": sub.get("htmlUrl", ""),
                    "icon": sub.get("iconUrl", "")
                }
                sources.append(source)

        return {"sources": sources}

@router.get("/{source_id}/articles")
async def get_source_articles(source_id: str, db: Session = Depends(get_db)):
    # Get FreshRSS credentials from environment
    freshrss_url = os.getenv('FRESHRSS_URL')
    freshrss_user = os.getenv('FRESHRSS_API_USER')
    freshrss_password = os.getenv('FRESHRSS_API_PASSWORD')

    if not all([freshrss_url, freshrss_user, freshrss_password]):
        raise HTTPException(status_code=500, detail="FreshRSS credentials not configured")

    # Login to get auth token
    async with httpx.AsyncClient() as client:
        login_url = f"{freshrss_url}/api/greader.php/accounts/ClientLogin"
        login_data = {
            "Email": freshrss_user,
            "Passwd": freshrss_password
        }
        login_res = await client.post(login_url, data=login_data)
        if login_res.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to login to FreshRSS")
        
        auth_token = login_res.text.split('Auth=')[1].strip()

        # Fetch articles for the source
        articles_url = f"{freshrss_url}/api/greader.php/reader/api/0/stream/contents/{source_id}"
        headers = {"Authorization": f"GoogleLogin auth={auth_token}"}
        res = await client.get(articles_url, headers=headers)
        
        if res.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch from FreshRSS")

        data = res.json()
        articles = []
        
        if "items" in data:
            for item in data["items"]:
                # Find the article in our database
                article = db.query(Article).filter(
                    Article.link == item.get("alternate", [{}])[0].get("href", "")
                ).first()
                
                if article and article.is_processed:
                    formatted_article = {
                        "id": str(article.id),
                        "title": article.title,
                        "summary": {"content": article.description},
                        "published": int(article.published_at.timestamp()) if article.published_at else 0,
                        "origin": article.source_name,
                        "url": article.link,
                        "categories": [cat.name for cat in article.categories],
                        "related": [str(rel.id) for rel in article.related_articles],
                        "thumbnail_url": article.thumbnail_url or f"/thumbnails/{article.id}"
                    }
                    articles.append(formatted_article)

        return {"articles": articles} 