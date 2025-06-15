# NewsFeed Backend API Documentation

---

## Table of Contents

- [Authentication & Roles](#authentication--roles)
- [Articles](#articles)
  - [List Articles](#list-articles)
  - [Get Single Article](#get-single-article)
- [Categories](#categories)
  - [Get Article Categories](#get-article-categories)
  - [Batch Get Categories](#batch-get-categories)
  - [Admin: Add/Edit/Delete Category](#admin-addeditdelete-category)
- [Related Articles](#related-articles)
  - [Get Related Articles](#get-related-articles)
  - [Batch Get Related Articles](#batch-get-related-articles)
  - [Admin: Rebuild Related](#admin-rebuild-related)
- [Thumbnails](#thumbnails)
  - [Get Article Thumbnail](#get-article-thumbnail)
  - [Batch Get Thumbnails](#batch-get-thumbnails)
  - [Static Thumbnail Serving](#static-thumbnail-serving)
- [Sources](#sources)
  - [List Sources](#list-sources)
  - [Get Source Articles](#get-source-articles)
  - [Admin: Edit/Delete Source](#admin-editdelete-source)
  - [Admin: Refresh/Clear Source](#admin-refreshclear-source)
  - [Admin: Source Stats](#admin-source-stats)
- [Admin: Settings & Workers](#admin-settings--workers)
- [Auth Endpoints](#auth-endpoints)
- [Error Responses](#error-responses)

---

## Authentication & Roles

- Most endpoints are public, but admin endpoints require authentication via Casdoor and an `X-Auth-Key` header or session.
- Roles: `admin`, `poweruser`, `user`

---

## Articles

### List Articles
- **GET** `/api/articles`
- **Description:** Paginated list of articles with optional filters.
- **Query Parameters:**
  - `skip` (int): Offset (default: 0)
  - `limit` (int): Max results (default: 20, max: 100)
  - `category` (str): Filter by category
  - `source` (str): Filter by source
  - `search` (str): Search in title/description

**Example:**
```bash
curl 'http://localhost:8000/api/articles?limit=5&category=US'
```

**Response:**
```json
{
  "articles": [
    {
      "id": "1",
      "title": "Title...",
      "summary": "...",
      "published": 1712345678,
      "origin": "NY Times",
      "url": "https://...",
      "categories": ["US"],
      "related": ["2"],
      "thumbnail_url": "/thumbnails/1.webp"
    }
  ],
  "total": 100,
  "skip": 0,
  "limit": 5
}
```

### Get Single Article
- **GET** `/api/articles/{article_id}`
- **Description:** Get details for a specific article.

**Example:**
```bash
curl 'http://localhost:8000/api/articles/1'
```

**Response:**
```json
{
  "article": {
    "id": "1",
    "title": "Title...",
    "summary": "...",
    "content": "...",
    "published": 1712345678,
    "origin": "NY Times",
    "url": "https://...",
    "categories": ["US"],
    "related": ["2"],
    "thumbnail_url": "/thumbnails/1.webp"
  }
}
```

---

## Categories

### Get Article Categories
- **GET** `/api/categories/{article_id}`
- **Description:** Get categories for an article.

**Example:**
```bash
curl 'http://localhost:8000/api/categories/1'
```

**Response:**
```json
{"categories": ["US", "Politics"]}
```

### Batch Get Categories
- **POST** `/api/categories/batch`
- **Body:** `{ "article_ids": [1,2,3] }`

**Example:**
```bash
curl -X POST 'http://localhost:8000/api/categories/batch' \
  -H 'Content-Type: application/json' \
  -d '{"article_ids": [1,2,3]}'
```

**Response:**
```json
{"1": {"categories": ["US"]}, "2": {"categories": ["World"]}}
```

### Admin: Add/Edit/Delete Category
- **POST** `/api/admin/categories/` (add)
- **PUT** `/api/admin/categories/{id}` (edit)
- **DELETE** `/api/admin/categories/{id}` (delete)
- **Auth:** `admin` or `poweruser`

---

## Related Articles

### Get Related Articles
- **GET** `/api/related/{article_id}`

### Batch Get Related Articles
- **POST** `/api/related/batch`
- **Body:** `{ "article_ids": [1,2,3] }`

### Admin: Rebuild Related
- **POST** `/api/admin/related/rebuild`
- **Auth:** `admin` or `poweruser`

---

## Thumbnails

### Get Article Thumbnail
- **GET** `/api/thumbnails/{article_id}`

### Batch Get Thumbnails
- **POST** `/api/thumbnails/batch`
- **Body:** `{ "article_ids": [1,2,3] }`

### Static Thumbnail Serving
- **GET** `/thumbnails/{article_id}.webp`
- **Description:** Served directly by nginx as a static file.

**Example:**
```html
<img src="/thumbnails/1.webp" alt="Article Thumbnail" />
```

---

## Sources

### List Sources
- **GET** `/api/sources`

### Get Source Articles
- **GET** `/api/sources/{source_id}/articles`

### Admin: Edit/Delete Source
- **PUT** `/api/admin/sources/{id}`
- **DELETE** `/api/admin/sources/{id}`

### Admin: Refresh/Clear Source
- **POST** `/api/admin/sources/{feed_id}/refresh`
- **POST** `/api/admin/sources/{title}/clear`

### Admin: Source Stats
- **GET** `/api/admin/sources/{feed_id}/count`
- **GET** `/api/admin/sources/stats/{feed_url}`

---

## Admin: Settings & Workers

### Get/Update Settings
- **GET** `/api/admin/settings/`
- **PUT** `/api/admin/settings/`

### Trigger Article Processing
- **POST** `/api/admin/workers/process-articles`

---

## Auth Endpoints

### Casdoor Token Proxy
- **POST** `/api/auth/casdoor/token`
- **Description:** Proxy to Casdoor for OAuth token exchange.

### Get User Info
- **GET** `/api/auth/get-user`

---

## Error Responses

All endpoints may return:
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Missing/invalid auth
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

**Error Example:**
```json
{"detail": "Article not found"}
```

---

## Example Python Usage

```python
import requests

# List articles
resp = requests.get('http://localhost:8000/api/articles?limit=5')
print(resp.json())

# Get single article
resp = requests.get('http://localhost:8000/api/articles/1')
print(resp.json())

# Get categories for an article
resp = requests.get('http://localhost:8000/api/categories/1')
print(resp.json())

# Get a thumbnail (static)
resp = requests.get('http://localhost:8000/thumbnails/1.webp')
with open('thumb1.webp', 'wb') as f:
    f.write(resp.content)
``` 