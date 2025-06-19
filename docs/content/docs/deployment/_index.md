---
weight: 4
bookFlatSection: true
title: "Deployment"
---

# Deployment Guide

This section covers the deployment of the NewsFeed application in various environments.

## Docker Deployment

The NewsFeed application is designed to be deployed using Docker and Docker Compose. The main configuration file is `docker-compose.yml`, which defines all the services required for the application.

### Build and Run

To build and run the application, use Docker Compose:

```bash
# Build all services
docker compose build

# Start all services
docker compose up -d

# Build and start a specific service
docker compose up -d --build nginx
```

### Simplified Nginx Build

The Nginx service uses a multi-stage build process defined in `nginx/Dockerfile`. This approach builds the documentation using Hugo in the first stage and then serves it with Nginx in the second stage, simplifying the deployment process.

### Services

The application consists of the following services:

1. **nginx**: Serves as the entry point and hosts the documentation
2. **frontend**: Next.js application for the user interface
3. **backend**: FastAPI application for the API
4. **worker**: Celery worker for background tasks
5. **beat**: Celery beat for scheduled tasks
6. **db**: PostgreSQL database for the application
7. **redis**: Redis for caching and message broker
8. **casdoor**: Authentication service
9. **casdoor-db**: PostgreSQL database for Casdoor

## Environment Configuration

Each service requires specific environment variables to be set. These are stored in files under the `env/` directory:

- `env/frontend`: Environment variables for the frontend service
- `env/backend`: Environment variables for the backend and worker services

See the [Backend Environment](./backend-environment) page for more details on the backend environment variables.

## Additional Resources

- [Docker Optimizations](./docker-optimizations): Tips for optimizing Docker builds and containers
- [Runtime Environment](./runtime-environment): Configuration of the runtime environment
- [CI/CD](./ci-cd): Continuous Integration and Deployment setup
