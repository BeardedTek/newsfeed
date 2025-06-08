from fastapi import APIRouter

router = APIRouter()

@router.get("/{article_id}")
def get_related(article_id: str):
    # TODO: Implement fetching/generating related articles
    return {"related": []}

@router.post("/batch")
def batch_related(article_ids: list[str]):
    # TODO: Implement batch related
    return {"results": []} 