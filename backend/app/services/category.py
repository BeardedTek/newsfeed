from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models.database import Article, Category
from fastapi import HTTPException

class CategoryService:
    """Service for category-related operations."""
    
    @staticmethod
    def get_article_categories(db: Session, article_id: int) -> Dict[str, List[str]]:
        """Get categories for a specific article."""
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        return {"categories": [cat.name for cat in article.categories]}
    
    @staticmethod
    def batch_get_categories(db: Session, article_ids: List[int]) -> Dict[str, Dict[str, List[str]]]:
        """Get categories for multiple articles."""
        if len(article_ids) > 20:
            raise HTTPException(status_code=400, detail="Batch size too large")
        
        results = {}
        for article_id in article_ids:
            article = db.query(Article).filter(Article.id == article_id).first()
            if article:
                results[str(article_id)] = {"categories": [cat.name for cat in article.categories]}
        
        return results
    
    @staticmethod
    def list_categories(db: Session) -> Dict[str, List[str]]:
        """List all categories."""
        categories = db.query(Category).order_by(Category.name).all()
        return {"categories": [cat.name for cat in categories]} 