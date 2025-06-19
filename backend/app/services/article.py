from typing import Dict, List, Any, Optional
from sqlalchemy import desc
from sqlalchemy.orm import Session
from app.models.database import Article, Category
from app.freshrss_api_ext import FreshRSSAPIExt
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)

class ArticleService:
    """Service for article-related operations."""
    
    @staticmethod
    def get_google_favicon_url(url: str) -> str:
        """Get Google Favicon URL for a given website URL."""
        try:
            parsed_url = urlparse(url)
            domain = parsed_url.netloc
            return f"https://www.google.com/s2/favicons?sz=256&domain={domain}"
        except Exception:
            return ""
    
    @staticmethod
    def format_article(article: Article) -> Dict[str, Any]:
        """Format an article for API response."""
        # Determine thumbnail_url according to rules
        thumbnail_url = (
            article.thumbnail_url if article.thumbnail_url else (
                article.image_url if article.image_url else ArticleService.get_google_favicon_url(article.source_url)
            )
        )
        
        return {
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
    
    @staticmethod
    def format_freshrss_article(item: Dict[str, Any]) -> Dict[str, Any]:
        """Format a FreshRSS article for API response."""
        # Determine thumbnail_url for FreshRSS item
        item_thumbnail_url = (
            item.get("enclosure_url") if item.get("enclosure_url") else (
                item.get("image_url") if item.get("image_url") else 
                ArticleService.get_google_favicon_url(item.get("origin", {}).get("htmlUrl", ""))
            )
        )
        
        return {
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
            "image_url": item.get("enclosure_url", "")
        }
    
    @staticmethod
    def get_articles(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        source: Optional[str] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get articles with optional filtering."""
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
        formatted_articles = [ArticleService.format_article(article) for article in articles]

        return {
            "articles": formatted_articles,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    
    @staticmethod
    def get_article_by_id(db: Session, article_id: int) -> Dict[str, Any]:
        """Get a single article by ID."""
        article = db.query(Article).filter(Article.id == article_id).first()
        
        if not article:
            return None
            
        return {
            "article": ArticleService.format_article(article)
        }
    
    @staticmethod
    def get_article_from_freshrss(article_id: int, client: FreshRSSAPIExt) -> Dict[str, Any]:
        """Get an article directly from FreshRSS."""
        items_response = client.get_items_from_ids([article_id])
        items = items_response["items"] if isinstance(items_response, dict) and "items" in items_response else items_response
        
        if not items:
            return None
            
        item = items[0]
        
        return {
            "article": ArticleService.format_freshrss_article(item)
        } 