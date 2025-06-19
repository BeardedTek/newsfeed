from app.freshrss_api_ext import FreshRSSAPIExt
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class FreshRSSService:
    """Service for FreshRSS API operations."""
    
    @staticmethod
    def get_client() -> FreshRSSAPIExt:
        """Create and return a FreshRSS API client instance using environment variables."""
        try:
            client = FreshRSSAPIExt(verbose=False)  # Uses env vars
            return client
        except Exception as e:
            logger.error(f"Failed to initialize FreshRSS client: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to initialize FreshRSS client")
    
    @staticmethod
    async def get_source_articles(source_id: str) -> dict:
        """Get articles for a specific source from FreshRSS."""
        try:
            client = FreshRSSService.get_client()
            # Get items for the specific feed
            items = client.get_items_from_ids([int(source_id)])
            
            from app.services.article import ArticleService
            
            articles = []
            for item in items:
                article = ArticleService.format_freshrss_article(item)
                articles.append(article)
                
            return {"articles": articles}
        except Exception as e:
            logger.error(f"Failed to fetch articles from FreshRSS: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch articles from FreshRSS: {str(e)}")
    
    @staticmethod
    async def get_sources() -> dict:
        """Get all sources from FreshRSS."""
        try:
            client = FreshRSSService.get_client()
            response = client.get_feeds()
            
            # Extract the feeds list from the response dictionary
            sources = response.get('feeds', [])
            
            formatted_sources = []
            for source in sources:
                formatted_sources.append({
                    "id": str(source["id"]),
                    "title": source["title"],
                    "url": source.get("site_url", ""),
                    "description": source.get("description", ""),
                    "category": source.get("category", {}).get("label", "")
                })
                
            return {"sources": formatted_sources}
        except Exception as e:
            logger.error(f"Failed to fetch sources from FreshRSS: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch sources from FreshRSS: {str(e)}") 