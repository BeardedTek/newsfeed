from pydantic import BaseModel
from typing import Optional, List

class Article(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    published: Optional[int] = None
    origin: Optional[str] = None
    url: Optional[str] = None
    categories: Optional[List[str]] = []
    related: Optional[List[str]] = []
    thumbnail_url: Optional[str] = None 