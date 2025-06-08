from fastapi import FastAPI
from app.api import articles, categories, related, thumbnails

app = FastAPI(title="NewsFeed Backend API")

app.include_router(articles.router, prefix="/articles", tags=["articles"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])
app.include_router(related.router, prefix="/related", tags=["related"])
app.include_router(thumbnails.router, prefix="/thumbnails", tags=["thumbnails"])

@app.get("/")
def root():
    return {"status": "ok"} 