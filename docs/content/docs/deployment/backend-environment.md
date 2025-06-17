---
weight: 46
title: "Backend Environment Variables"
---

# Backend and Worker Environment Variables

NewsFeed's backend services (API and worker) are configured using environment variables. This page documents all available environment variables and their purpose.

## Configuration Categories

The backend environment variables are organized into several categories:

1. **Core Configuration**: Basic settings for the backend services
2. **Database Configuration**: PostgreSQL connection settings
3. **Redis Configuration**: Redis connection settings
4. **FreshRSS Configuration**: Settings for the FreshRSS integration
5. **Worker Configuration**: Settings for the Celery worker and tasks
6. **Authentication Configuration**: Casdoor authentication settings

## Core Configuration

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `BACKEND_DEBUG` | Enable debug mode for the backend | `"false"` |
| `TIMEZONE` | Timezone for date/time operations | `"UTC"` |
| `THUMBNAIL_DIR` | Directory to store article thumbnails | `"/thumbnails"` |

## Database Configuration

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `POSTGRES_USER` | PostgreSQL username | `"postgres"` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `"postgres"` |
| `POSTGRES_DB` | PostgreSQL database name | `"newsfeed"` |
| `POSTGRES_HOST` | PostgreSQL host address | `"db"` |
| `POSTGRES_PORT` | PostgreSQL port | `"5432"` |

## Redis Configuration

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `REDIS_URL` | Redis connection URL | `"redis://redis:6379/0"` |

## FreshRSS Configuration

### FreshRSS GReader API

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `FRESHRSS_GREADER_API_URL` | FreshRSS GReader API URL | None |
| `FRESHRSS_GREADER_API_USER` | FreshRSS GReader API username | None |
| `FRESHRSS_GREADER_API_PASSWORD` | FreshRSS GReader API password | None |

### FreshRSS Python API

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `FRESHRSS_PYTHON_API_HOST` | FreshRSS Python API host | None |
| `FRESHRSS_PYTHON_API_USERNAME` | FreshRSS Python API username | None |
| `FRESHRSS_PYTHON_API_PASSWORD` | FreshRSS Python API password | None |
| `FRESHRSS_PYTHON_API_VERIFY_SSL` | Verify SSL certificates | `"true"` |

### FreshRSS Proxy API

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `FRESHRSS_PROXY_API_URL` | FreshRSS Proxy API URL | None |
| `FRESHRSS_PROXY_API_KEY` | FreshRSS Proxy API key | None |

## Worker Configuration

### Task Scheduling

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `WORKER_PROCESS_ARTICLES_INTERVAL` | How often to process articles (minutes) | `15` |
| `WORKER_PURGE_OLD_ARTICLES_INTERVAL` | How often to purge old articles (minutes) | `1440` (24 hours) |
| `WORKER_ENRICH_ARTICLES_INTERVAL` | How often to enrich articles (minutes) | `60` (1 hour) |

### Article Fetching and Retention

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `WORKER_FRESHRSS_FETCH_LIMIT` | Maximum articles to fetch per batch | `100` |
| `WORKER_CONCURRENT_FRESHRSS_FETCH_TASKS` | Number of concurrent fetch tasks | `1` |
| `WORKER_FRESHRSS_FETCH_DAYS` | Number of days to fetch articles from | `3` |
| `WORKER_FRESHRSS_PURGE_NUM_DAYS_TO_KEEP` | Number of days to keep articles | `7` |

### Worker Performance

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `WORKER_TASK_TIME_LIMIT` | Maximum task runtime (seconds) | `300` (5 minutes) |
| `WORKER_SOFT_TIME_LIMIT` | Soft time limit for tasks (seconds) | `240` (4 minutes) |
| `WORKER_MAX_TASKS_PER_CHILD` | Tasks per worker before replacement | `100` |
| `WORKER_MAX_MEMORY_PER_CHILD` | Memory limit per worker (KB) | `200000` (200MB) |
| `WORKER_PREFETCH_MULTIPLIER` | Tasks to prefetch per worker | `1` |

## AI Configuration

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `OLLAMA_URL` | URL of the Ollama server | `"http://ollama:11434"` |
| `OLLAMA_MODEL` | AI model to use for categorization | `"LLAMA3.2:3B"` |

## Authentication Configuration

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `CASDOOR_ENDPOINT` | Casdoor server URL | `"http://casdoor:8000"` |
| `CASDOOR_CLIENT_ID` | Casdoor client ID | None |
| `CASDOOR_CLIENT_SECRET` | Casdoor client secret | None |
| `CASDOOR_ORG` | Casdoor organization name | `"newsfeed"` |
| `CASDOOR_APP_NAME` | Casdoor application name | `"newsfeed"` |
| `CASDOOR_CERT_PUBLIC_KEY` | Casdoor public key for JWT verification | None |

## Example Configuration

Here's an example of a complete backend environment configuration file:

```bash
# Backend and worker configuration
REDIS_URL=redis://redis:6379/0
BACKEND_DEBUG="false"
TIMEZONE=America/New_York

# Worker Fetch Configuration
WORKER_FRESHRSS_FETCH_LIMIT=100
WORKER_CONCURRENT_FRESHRSS_FETCH_TASKS=1
WORKER_FRESHRSS_FETCH_DAYS=3
WORKER_FRESHRSS_PURGE_NUM_DAYS_TO_KEEP=7

# Worker Task Scheduling
WORKER_PROCESS_ARTICLES_INTERVAL=15
WORKER_PURGE_OLD_ARTICLES_INTERVAL=1440
WORKER_ENRICH_ARTICLES_INTERVAL=60

# Worker Performance Settings
WORKER_TASK_TIME_LIMIT=300
WORKER_SOFT_TIME_LIMIT=240
WORKER_MAX_TASKS_PER_CHILD=100
WORKER_MAX_MEMORY_PER_CHILD=200000
WORKER_PREFETCH_MULTIPLIER=1

# FreshRSS and FreshRSS API Proxy Setup
FRESHRSS_GREADER_API_URL=https://freshrss.example.com/api/greader.php
FRESHRSS_GREADER_API_USER=newsfeed
FRESHRSS_GREADER_API_PASSWORD=your_password_here

FRESHRSS_PYTHON_API_HOST=https://freshrss.example.com
FRESHRSS_PYTHON_API_USERNAME=newsfeed
FRESHRSS_PYTHON_API_PASSWORD=your_password_here
FRESHRSS_PYTHON_API_VERIFY_SSL=true

# Ollama Configuration
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=LLAMA3.2:3B

# Database configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=newsfeed
POSTGRES_HOST=db

# Casdoor Configuration
CASDOOR_ENDPOINT=http://casdoor:8000
CASDOOR_CLIENT_ID=your_client_id_here
CASDOOR_CLIENT_SECRET=your_client_secret_here
CASDOOR_ORG=newsfeed
CASDOOR_APP_NAME=newsfeed
CASDOOR_CERT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----"
```

## Environment Variable Precedence

Environment variables can be set in multiple ways, with the following precedence (highest to lowest):

1. Docker Compose environment variables
2. Environment file (`env/backend`)
3. Default values in the code

## Sensitive Information

For production deployments, sensitive information such as passwords and API keys should be managed securely:

1. Use environment variables instead of hardcoding values
2. Consider using Docker secrets or a secure vault service
3. Rotate credentials regularly
4. Use different credentials for development and production environments

## Debugging

When troubleshooting issues with the backend or worker services, the following environment variables can be helpful:

- Set `BACKEND_DEBUG="true"` to enable detailed logging
- Adjust worker task limits (`WORKER_TASK_TIME_LIMIT`, `WORKER_SOFT_TIME_LIMIT`) if tasks are timing out
- Modify `WORKER_FRESHRSS_FETCH_LIMIT` if you're experiencing performance issues during article fetching 