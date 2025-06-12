from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any
from app.database import get_db
from app.models.database import Article, Category
from app.models.article import Article as ArticleSchema

router = APIRouter()

@router.get("")
@router.get("/")
async def get_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: str = None,
    source: str = None,
    search: str = None,
    db: Session = Depends(get_db)
):
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
        formatted_article = {
            "id": str(article.id),
            "title": article.title,
            "summary": article.description,
            "published": int(article.published_at.timestamp()) if article.published_at else 0,
            "origin": article.source_name,
            "url": article.link,
            "categories": [cat.name for cat in article.categories],
            "related": [str(rel.id) for rel in article.related_articles],
            "thumbnail_url": article.thumbnail_url or f"/thumbnails/{article.id}"
        }
        formatted_articles.append(formatted_article)

    return {
        "articles": formatted_articles,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{article_id}")
def get_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
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
            "related": [str(rel.id) for rel in article.related_articles],
            "thumbnail_url": article.thumbnail_url or f"/thumbnails/{article.id}"
        }
    } 