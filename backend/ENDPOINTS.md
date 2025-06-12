# NewsFeed API Documentation

This document provides a comprehensive overview of all available API endpoints in the NewsFeed backend.

## Base URL

All endpoints are prefixed with `/api`

## Authentication

Some endpoints may require authentication using an `X-Auth-Key` header. The authentication is handled through Casdoor.

## Articles

### List Articles
- **Endpoint:** `GET /articles`
- **Description:** Retrieves a paginated list of articles with optional filtering
- **Query Parameters:**
  - `skip` (int, optional): Number of articles to skip (default: 0)
  - `limit` (int, optional): Maximum number of articles to return (default: 20, max: 100)
  - `category` (string, optional): Filter by category name
  - `source` (string, optional): Filter by source name
  - `search` (string, optional): Search in title and description
- **Response:**
  ```json
  {
    "articles": [
      {
        "id": "string",
        "title": "string",
        "summary": "string",
        "published": "timestamp",
        "origin": "string",
        "url": "string",
        "categories": ["string"],
        "related": ["string"],
        "thumbnail_url": "string"
      }
    ],
    "total": "integer",
    "skip": "integer",
    "limit": "integer"
  }
  ```

### Get Single Article
- **Endpoint:** `GET /articles/{article_id}`
- **Description:** Retrieves detailed information about a specific article
- **Path Parameters:**
  - `article_id` (int): ID of the article to retrieve
- **Response:**
  ```json
  {
    "article": {
      "id": "string",
      "title": "string",
      "summary": "string",
      "content": "string",
      "published": "timestamp",
      "origin": "string",
      "url": "string",
      "categories": ["string"],
      "related": ["string"],
      "thumbnail_url": "string"
    }
  }
  ```

## Categories

### Get Article Categories
- **Endpoint:** `GET /categories/{article_id}`
- **Description:** Retrieves categories for a specific article
- **Path Parameters:**
  - `article_id` (int): ID of the article
- **Response:**
  ```json
  {
    "categories": ["string"]
  }
  ```

### Batch Get Categories
- **Endpoint:** `POST /categories/batch`
- **Description:** Retrieves categories for multiple articles in a single request
- **Request Body:**
  ```json
  {
    "article_ids": [1, 2, 3]
  }
  ```
- **Response:**
  ```json
  {
    "1": {
      "categories": ["string"]
    },
    "2": {
      "categories": ["string"]
    }
  }
  ```

## Related Articles

### Get Related Articles
- **Endpoint:** `GET /related/{article_id}`
- **Description:** Retrieves related articles for a specific article
- **Path Parameters:**
  - `article_id` (int): ID of the article
- **Response:**
  ```json
  {
    "related": ["string"]
  }
  ```

### Batch Get Related Articles
- **Endpoint:** `POST /related/batch`
- **Description:** Retrieves related articles for multiple articles in a single request
- **Request Body:**
  ```json
  {
    "article_ids": [1, 2, 3]
  }
  ```
- **Response:**
  ```json
  {
    "1": ["string"],
    "2": ["string"]
  }
  ```

## Thumbnails

### Get Article Thumbnail
- **Endpoint:** `GET /thumbnails/{article_id}`
- **Description:** Retrieves the thumbnail URL for a specific article
- **Path Parameters:**
  - `article_id` (int): ID of the article
- **Response:**
  ```json
  {
    "thumbnail_url": "string"
  }
  ```

### Batch Get Thumbnails
- **Endpoint:** `POST /thumbnails/batch`
- **Description:** Retrieves thumbnail URLs for multiple articles in a single request
- **Request Body:**
  ```json
  {
    "article_ids": [1, 2, 3]
  }
  ```
- **Response:**
  ```json
  {
    "1": "string",
    "2": "string"
  }
  ```

## Sources

### List Sources
- **Endpoint:** `GET /sources`
- **Description:** Retrieves a list of all available news sources
- **Response:**
  ```json
  {
    "sources": [
      {
        "id": "string",
        "title": "string",
        "url": "string",
        "icon": "string"
      }
    ]
  }
  ```

### Get Source Articles
- **Endpoint:** `GET /sources/{source_id}/articles`
- **Description:** Retrieves articles from a specific source
- **Path Parameters:**
  - `source_id` (string): ID of the source
- **Response:**
  ```json
  {
    "articles": [
      {
        "id": "string",
        "title": "string",
        "summary": {
          "content": "string"
        },
        "published": "timestamp",
        "origin": "string",
        "url": "string",
        "categories": ["string"],
        "related": ["string"],
        "thumbnail_url": "string"
      }
    ]
  }
  ```

## Error Responses

All endpoints may return the following error responses:

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

## Rate Limiting

Batch endpoints have a limit of 20 items per request. 