---
weight: 40
title: "Docker Optimizations"
---

# Docker Optimizations

NewsFeed uses optimized Docker containers for both development and production environments. This page documents the optimizations and best practices implemented in our Docker setup.

## Multi-Stage Builds

Both frontend and backend services use multi-stage builds to optimize container size and security:

### Frontend Multi-Stage Build

The frontend Dockerfile uses a four-stage build process:

1. **Base Stage**: Sets up the common environment
2. **Dependencies Stage**: Installs npm dependencies
3. **Build Stage**: Compiles the Next.js application
4. **Runner Stage**: Creates a minimal production image

This approach significantly reduces the final image size by excluding development dependencies and build tools.

```dockerfile
# ---- Base Stage ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---- Build Stage ----
FROM dependencies AS builder
COPY src ./src
# ... copy other necessary files
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner
# ... copy only the necessary files from builder
```

### Backend Multi-Stage Build

The backend Dockerfile uses a two-stage build process:

1. **Builder Stage**: Installs all dependencies and build tools
2. **Runtime Stage**: Creates a minimal production image with only runtime dependencies

```dockerfile
# ---- Build Stage ----
FROM python:3.11-slim AS builder
# ... install build dependencies and Python packages

# ---- Runtime Stage ----
FROM python:3.11-slim AS runtime
# ... copy only the necessary files from builder
```

## Security Enhancements

### Non-Root User Execution

All services run as non-root users to enhance security:

- **Frontend**: Runs as the `nextjs` user
- **Backend**: Runs as the `appuser` user

This reduces the risk of container breakouts and follows security best practices.

```dockerfile
# Frontend example
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# Backend example
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser
```

### Proper File Permissions

All files and directories have appropriate ownership and permissions:

```dockerfile
# Set proper ownership for files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
RUN chown -R nextjs:nodejs /app
```

## Health Checks

All services include health checks for improved reliability:

### Frontend Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
```

### Backend Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8001/api/health')" || exit 1
```

### Worker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD celery -A app.workers.tasks inspect ping || exit 1
```

## Performance Optimizations

### Minimal Base Images

All services use Alpine or slim base images to reduce size:

- Frontend: `node:20-alpine`
- Backend: `python:3.11-slim`

### Optimized Dependency Installation

Dependencies are installed with flags to reduce size and improve performance:

```dockerfile
# Frontend
RUN npm ci --omit=dev --no-audit --no-fund

# Backend
RUN pip install --no-cache-dir -r requirements.txt
```

### Selective File Copying

Only necessary files are copied to each stage to improve build caching:

```dockerfile
# Copy only specific files instead of everything
COPY src ./src
COPY public ./public
COPY next.config.js ./
```

## Frontend Environment Variables

The frontend uses a runtime environment configuration system that allows changing environment variables without rebuilding the image:

1. A template file (`env-config.js`) is included in the image
2. At container startup, a script replaces placeholders with actual environment values
3. The application loads this file at runtime to access the environment configuration

This approach provides flexibility for deploying the same image to different environments.

## Docker Compose Integration

The `docker-compose.yml` file integrates all these optimizations:

- Specifies the correct build target for multi-stage builds
- Configures health checks for all services
- Sets up proper dependency chains between services
- Configures logging with rotation

## Best Practices Summary

- Use multi-stage builds to minimize image size
- Run containers as non-root users
- Implement health checks for all services
- Use minimal base images (Alpine/slim)
- Optimize dependency installation
- Copy only necessary files at each stage
- Use runtime environment configuration where possible
- Set proper file permissions and ownership 