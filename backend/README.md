# NewsFeed FastAPI Backend

This is the backend for NewsFeed, implemented with FastAPI and Celery workers. It provides APIs for articles, categories, related articles, and thumbnails, and runs background workers for processing.

## Structure

- `app/main.py` — FastAPI app entrypoint
- `app/api/` — API routers for articles, categories, related, thumbnails
- `app/models/` — Pydantic models
- `app/workers/` — Celery tasks for background processing

## Endpoints

- `GET /articles` — List articles
- `GET /articles/{id}` — Get single article
- `GET /articles/{id}/categories` — Get/generate categories
- `GET /articles/{id}/related` — Get/generate related articles
- `GET /articles/{id}/thumbnail` — Get/generate thumbnail
- `POST /categories/batch` — Batch categories
- `POST /related/batch` — Batch related
- `POST /thumbnails/batch` — Batch thumbnails

## Running the API

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

## Running the Workers

```bash
cd backend
source venv/bin/activate
celery -A app.workers.tasks.celery_app worker --loglevel=info
```

## Requirements
- Python 3.10+
- Redis (for Celery broker and caching)

## TODO
- Implement article fetching and storage
- Implement category, related, and thumbnail generation
- Add authentication if needed 