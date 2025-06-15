from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict
import os
from pathlib import Path
from app.database import get_db
from app.models.database import Article

router = APIRouter()

# Create thumbnail directory if it doesn't exist
THUMBNAIL_DIR = Path("thumbnails")
THUMBNAIL_DIR.mkdir(exist_ok=True)

@router.get("/{article_id}")
async def get_thumbnail(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    # Apply thumbnail_url logic
    thumbnail_url = (
        article.thumbnail_url if article.thumbnail_url else (
            article.image_url if article.image_url else '/favicon.svg'
        )
    )
    return {"thumbnail_url": thumbnail_url}

@router.post("/batch")
async def batch_thumbnails(article_ids: List[int], db: Session = Depends(get_db)):
    if len(article_ids) > 20:
        raise HTTPException(status_code=400, detail="Batch size too large")
    results = {}
    for article_id in article_ids:
        article = db.query(Article).filter(Article.id == article_id).first()
        if article:
            thumbnail_url = (
                article.thumbnail_url if article.thumbnail_url else (
                    article.image_url if article.image_url else '/favicon.svg'
                )
            )
            results[str(article_id)] = thumbnail_url
    return results

# Thumbnail URLs are now included in the articles response
# This file is kept for future use if needed 