from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict
from app.database import get_db
from app.models.database import Article, Category

router = APIRouter()

@router.get("/{article_id}")
async def get_categories(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return {"categories": [cat.name for cat in article.categories]}

@router.post("/batch")
async def batch_categories(article_ids: List[int], db: Session = Depends(get_db)):
    if len(article_ids) > 20:
        raise HTTPException(status_code=400, detail="Batch size too large")
    
    results = {}
    for article_id in article_ids:
        article = db.query(Article).filter(Article.id == article_id).first()
        if article:
            results[str(article_id)] = {"categories": [cat.name for cat in article.categories]}
    
    return results

# Categories are now included in the articles response
# This file is kept for future use if needed 

@router.get("/", summary="List all categories")
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.name).all()
    return {"categories": [cat.name for cat in categories]} 