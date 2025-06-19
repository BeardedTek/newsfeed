from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.related import RelatedService

router = APIRouter()

@router.get("/{article_id}")
async def get_related(article_id: int, db: Session = Depends(get_db)):
    """
    Get related articles for a specific article.
    
    - **article_id**: ID of the article to retrieve related articles for
    """
    return RelatedService.get_related_articles(db, article_id)

@router.post("/batch")
async def batch_related(article_ids: List[int], db: Session = Depends(get_db)):
    """
    Get related articles for multiple articles.
    
    - **article_ids**: List of article IDs to retrieve related articles for (max 20)
    """
    return RelatedService.batch_get_related(db, article_ids)

# Related articles are now included in the articles response
# This file is kept for future use if needed 