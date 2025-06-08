from fastapi import APIRouter

router = APIRouter()

@router.get("/{article_id}")
def get_thumbnail(article_id: str):
    # TODO: Implement fetching/generating a thumbnail
    return {"thumbnail_url": f"/thumbnails/{article_id}.webp"}

@router.post("/batch")
def batch_thumbnails(article_ids: list[str]):
    # TODO: Implement batch thumbnails
    return {"results": []} 