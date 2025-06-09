from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict
from app.database import get_db
from app.models.database import Article

router = APIRouter()

@router.get("/{article_id}")
async def get_related(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return {"related": [str(rel.id) for rel in article.related_articles]}

@router.post("/batch")
async def batch_related(article_ids: List[int], db: Session = Depends(get_db)):
    if len(article_ids) > 20:
        raise HTTPException(status_code=400, detail="Batch size too large")
    
    results = {}
    for article_id in article_ids:
        article = db.query(Article).filter(Article.id == article_id).first()
        if article:
            results[str(article_id)] = [str(rel.id) for rel in article.related_articles]
    
    return results 