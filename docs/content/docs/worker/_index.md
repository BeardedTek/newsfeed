---
weight: 40
title: "Worker Tasks"
bookCollapseSection: true
---

# Worker Tasks

This section provides detailed information about the background worker tasks in NewsFeed.

## Overview

NewsFeed uses Celery for background task processing. These tasks handle resource-intensive operations such as:

- Fetching articles from FreshRSS
- Processing article content
- Generating thumbnails
- Categorizing articles
- Finding related articles
- Purging old articles

## Task Architecture

The worker system consists of:

1. **Celery Workers** - Process tasks from the queue
2. **Redis** - Message broker and result backend
3. **Beat Scheduler** - Schedules periodic tasks

## Environment Variables

The worker system can be configured using the following environment variables:

### Task Scheduling

- `WORKER_PROCESS_ARTICLES_INTERVAL`: How often to process articles (in minutes, default: 15)
- `WORKER_PURGE_OLD_ARTICLES_INTERVAL`: How often to purge old articles (in minutes, default: 1440 - 24 hours)
- `WORKER_ENRICH_ARTICLES_INTERVAL`: How often to enrich articles (in minutes, default: 60 - 1 hour)

### Article Fetching and Retention

- `WORKER_FRESHRSS_FETCH_LIMIT`: Maximum number of articles to fetch per batch (default: 100)
- `WORKER_CONCURRENT_FRESHRSS_FETCH_TASKS`: Number of concurrent fetch tasks (default: 1)
- `WORKER_FRESHRSS_FETCH_DAYS`: Number of days to look back for articles (default: 3)
- `WORKER_FRESHRSS_PURGE_NUM_DAYS_TO_KEEP`: Number of days to keep articles before purging (default: 7)

### Worker Performance

- `WORKER_TASK_TIME_LIMIT`: Maximum time a task can run in seconds (default: 300 - 5 minutes)
- `WORKER_SOFT_TIME_LIMIT`: Soft time limit for tasks in seconds (default: 240 - 4 minutes)
- `WORKER_MAX_TASKS_PER_CHILD`: Maximum number of tasks a worker process can execute before being replaced (default: 100)
- `WORKER_MAX_MEMORY_PER_CHILD`: Maximum memory usage in KB before worker is replaced (default: 200000 - 200MB)
- `WORKER_PREFETCH_MULTIPLIER`: Number of tasks to prefetch per worker (default: 1)

## Main Tasks

### Fetch Articles from FreshRSS

**Task name:** `fetch_freshrss_articles`

This task:

1. Connects to the FreshRSS API
2. Retrieves new articles since the last fetch
3. Stores articles in the database
4. Triggers processing tasks for each new article

**Schedule:** Runs based on `WORKER_PROCESS_ARTICLES_INTERVAL` (default: every 15 minutes)

### Process Article Content

**Task name:** `process_article_content`

This task:

1. Extracts the main content from the article HTML
2. Generates a summary using AI
3. Creates a thumbnail from the article's main image
4. Analyzes the content for categorization

**Triggered by:** `fetch_freshrss_articles` task

### Generate Thumbnails

**Task name:** `generate_thumbnail`

This task:

1. Extracts images from the article
2. Selects the best image for a thumbnail
3. Resizes and optimizes the image
4. Saves the thumbnail to the filesystem

**Triggered by:** `process_article_content` task

### Categorize Articles

**Task name:** `categorize_article`

This task:

1. Analyzes article content using AI
2. Assigns categories based on content analysis
3. Updates the article's category associations

**Configuration:**

- `OLLAMA_URL`: URL of the Ollama server
- `OLLAMA_MODEL`: AI model to use for categorization

**Triggered by:** `process_article_content` task

### Find Related Articles

**Task name:** `find_related_articles`

This task:

1. Analyzes the article content
2. Compares it with other articles in the database
3. Establishes relationships between similar articles

**Schedule:** Runs as part of the article processing workflow

### Purge Old Articles

**Task name:** `purge_old_articles`

This task:

1. Identifies articles older than the configured retention period
2. Removes them from the database
3. Deletes associated thumbnails

**Schedule:** Runs based on `WORKER_PURGE_OLD_ARTICLES_INTERVAL` (default: every 24 hours)

### Enrich Articles

**Task name:** `enrich_articles`

This task:

1. Finds articles with missing information (descriptions, images)
2. Fetches and extracts content from the original article URLs
3. Updates the articles with the enriched content

**Schedule:** Runs based on `WORKER_ENRICH_ARTICLES_INTERVAL` (default: every hour)

## Monitoring Worker Tasks

You can monitor worker tasks through:

1. Celery logs
2. Redis monitoring tools
3. Database queries for task status

## Troubleshooting

Common issues and solutions:

### Task Queue Buildup

**Symptoms:** Tasks are queuing up but not being processed

**Solutions:**

- Increase the number of worker processes
- Check for errors in worker logs
- Verify Redis connection
- Adjust `WORKER_PREFETCH_MULTIPLIER` if needed

### Memory Usage Issues

**Symptoms:** Workers consuming excessive memory

**Solutions:**

- Reduce `WORKER_MAX_MEMORY_PER_CHILD` value
- Implement task timeouts with `WORKER_TASK_TIME_LIMIT`
- Split large tasks into smaller chunks

### Failed Tasks

**Symptoms:** Tasks consistently failing

**Solutions:**

- Check worker logs for errors
- Verify external service connections (FreshRSS, Ollama)
- Test tasks manually using the Celery command line
