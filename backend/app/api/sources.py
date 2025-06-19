from fastapi import APIRouter, HTTPException
from app.services.freshrss import FreshRSSService

router = APIRouter()

@router.get("/")
async def get_sources():
    """
    Get all sources from FreshRSS.
    """
    return await FreshRSSService.get_sources()

@router.get("/{source_id}/articles")
async def get_source_articles(source_id: str):
    """
    Get articles for a specific source from FreshRSS.
    
    - **source_id**: ID of the source to retrieve articles for
    """
    return await FreshRSSService.get_source_articles(source_id) 