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

To build and run the application, use the provided `build.sh` script at the project root:

```bash
./build.sh [options]
```

Available options:
- `--nginx-only`: Only build the nginx image
- `--no-nginx`: Skip building the nginx image
- `--push`: Push images to Docker Hub after building
- `--up`: Start the services after building
- `-d`: Start the services in detached mode

### Custom Nginx Build

The nginx service uses a custom build process defined in `nginx/build-nginx.sh`. This script builds the documentation using Hugo before building the Docker image.

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
- [Git Hooks](./git-hooks): Git hooks for development workflow
- [Runtime Environment](./runtime-environment): Configuration of the runtime environment
- [CI/CD](./ci-cd): Continuous Integration and Deployment setup
