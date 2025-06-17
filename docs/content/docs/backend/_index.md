---
weight: 30
title: "Backend API Documentation"
bookCollapseSection: true
---

# Backend API Documentation

This section provides detailed information about the NewsFeed backend API endpoints.

## API Overview

The NewsFeed API is built using FastAPI and follows RESTful principles. All API endpoints are prefixed with `/api`.

## Authentication

Most API endpoints require authentication. The API uses Casdoor for authentication and authorization.

To authenticate:

1. Obtain an access token from the Casdoor authentication endpoint
2. Include the token in the `Authorization` header of your requests:

   ```
   Authorization: Bearer <your_token>
   ```

## API Endpoints

### Articles

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/articles` | GET | List articles with pagination |
| `/api/articles/{id}` | GET | Get article by ID |
| `/api/articles/search` | GET | Search articles |
| `/api/articles/latest` | GET | Get latest articles |
| `/api/articles/popular` | GET | Get popular articles |

#### List Articles

```
GET /api/articles
```

Query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `category`: Filter by category
- `source`: Filter by source
- `from_date`: Filter by date (format: YYYY-MM-DD)
- `to_date`: Filter by date (format: YYYY-MM-DD)

### Categories

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/categories` | GET | List all categories |
| `/api/categories` | POST | Create a new category (admin only) |
| `/api/categories/{id}` | GET | Get category by ID |
| `/api/categories/{id}` | PUT | Update a category (admin only) |
| `/api/categories/{id}` | DELETE | Delete a category (admin only) |
| `/api/categories/{id}/articles` | GET | Get articles in a category |

### Sources

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sources` | GET | List all sources |
| `/api/sources` | POST | Add a new source (admin only) |
| `/api/sources/{id}` | GET | Get source by ID |
| `/api/sources/{id}` | PUT | Update a source (admin only) |
| `/api/sources/{id}` | DELETE | Delete a source (admin only) |
| `/api/sources/{id}/articles` | GET | Get articles from a source |

### Related Articles

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/related/{article_id}` | GET | Get related articles |
| `/api/related` | POST | Create related article connection (admin only) |
| `/api/related/{id}` | DELETE | Delete related article connection (admin only) |

### Thumbnails

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/thumbnails/{article_id}` | GET | Get article thumbnail |

### Admin

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/rebuild` | POST | Trigger system rebuild (admin only) |
| `/api/admin/settings` | GET | Get system settings (admin only) |
| `/api/admin/settings` | PUT | Update system settings (admin only) |

## Response Format

All API responses follow a standard format:

```json
{
  "status": "success",
  "data": {
    // Response data here
  },
  "message": "Optional message"
}
```

For error responses:

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

When rate limited, the API will return a 429 status code.
