---
title: "NewsFeed Documentation"
---

# NewsFeed Documentation

Welcome to the NewsFeed documentation! This guide will help you understand, deploy, and use the NewsFeed platform.

## What is NewsFeed?

NewsFeed is a modern news aggregation and personalization platform built with Next.js, FastAPI, and Docker. It provides a seamless experience for users to discover, read, and organize news content from various sources.

## Key Features

- Real-time news aggregation and updates
- User authentication and personalization (via Casdoor)
- RSS feed integration (via FreshRSS)
- AI-powered content categorization and recommendations
- Responsive and modern UI built with Flowbite and Tailwind CSS
- Background task processing with Celery
- Redis caching for improved performance
- PostgreSQL database for persistent storage

## Getting Started

To get started with NewsFeed, check out the following sections:

- [Frontend Usage Guide](/docs/frontend/) - Learn how to use the NewsFeed interface
- [Admin Dashboard Guide](/docs/admin/) - Manage and configure your NewsFeed instance
- [Backend API Documentation](/docs/backend/) - Explore the API endpoints
- [Deployment Guides](/docs/deployment/) - Deploy NewsFeed on various platforms

## Project Structure

The project is organized into separate components:

```
newsfeed/
├── frontend/        # Next.js frontend application
├── backend/         # FastAPI backend application
├── casdoor/         # Casdoor authentication service configuration
├── nginx/           # Nginx reverse proxy configuration
├── env/             # Environment variable files
├── docs/            # Documentation website
└── utils/           # Utility scripts
``` 