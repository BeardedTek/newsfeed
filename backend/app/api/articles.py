from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_articles():
    # TODO: Implement fetching articles
    return {"articles": []}

@router.get("/{article_id}")
def get_article(article_id: str):
    # TODO: Implement fetching a single article
    return {"article": {"id": article_id}} 