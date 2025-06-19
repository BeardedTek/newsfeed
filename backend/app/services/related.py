from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models.database import Article
from fastapi import HTTPException

class RelatedService:
    """Service for related articles operations."""
    
    @staticmethod
    def get_related_articles(db: Session, article_id: int) -> Dict[str, List[str]]:
        """Get related articles for a specific article."""
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        return {"related": [str(rel.id) for rel in article.related_articles]}
    
    @staticmethod
    def batch_get_related(db: Session, article_ids: List[int]) -> Dict[str, List[str]]:
        """Get related articles for multiple articles."""
        if len(article_ids) > 20:
            raise HTTPException(status_code=400, detail="Batch size too large")
        
        results = {}
        for article_id in article_ids:
            article = db.query(Article).filter(Article.id == article_id).first()
            if article:
                results[str(article_id)] = [str(rel.id) for rel in article.related_articles]
        
        return results 