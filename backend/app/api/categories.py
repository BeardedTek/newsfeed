from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.category import CategoryService

router = APIRouter()

@router.get("/{article_id}")
async def get_categories(article_id: int, db: Session = Depends(get_db)):
    """
    Get categories for a specific article.
    
    - **article_id**: ID of the article to retrieve categories for
    """
    return CategoryService.get_article_categories(db, article_id)

@router.post("/batch")
async def batch_categories(article_ids: List[int], db: Session = Depends(get_db)):
    """
    Get categories for multiple articles.
    
    - **article_ids**: List of article IDs to retrieve categories for (max 20)
    """
    return CategoryService.batch_get_categories(db, article_ids)

@router.get("/", summary="List all categories")
def list_categories(db: Session = Depends(get_db)):
    """
    List all categories in the system.
    """
    return CategoryService.list_categories(db)

# Categories are now included in the articles response
# This file is kept for future use if needed 