# ---- Hugo Documentation Build Stage ----
FROM ghcr.io/gohugoio/hugo:v0.147.8 AS docs-builder

# We need to be root to copy things over and chown the /public directory
USER root

# Copy the docs content
COPY docs/ ./
RUN chown -R hugo /project
USER hugo

# Build the documentation
RUN hugo --minify

# ---- Nginx Base Stage ----
FROM nginx:stable-alpine AS nginx-base

# Install required packages for performance optimization
RUN apk add --no-cache curl tzdata

# Configure timezone
ENV TZ=UTC

# Create directories
RUN mkdir -p /thumbnails

# ---- Production Stage ----
FROM nginx-base AS production

# Copy the built documentation from the docs-builder stage
COPY --from=docs-builder /project/public /docs/public

# Copy nginx configuration
COPY nginx/proxy.conf /etc/nginx/nginx.conf

# Copy static files
COPY frontend/public/favicon.ico /usr/share/nginx/html/favicon.ico

# Performance tuning
RUN echo "worker_rlimit_nofile 65535;" >> /etc/nginx/nginx.conf && \
    sed -i 's/worker_connections  1024/worker_connections  4096/' /etc/nginx/nginx.conf && \
    chown -R nginx:nginx /var/cache/nginx /docs /thumbnails && \
    chmod -R 755 /docs/public && \
    chmod -R 755 /thumbnails

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/docs/ || exit 1

# Expose port
EXPOSE 80

# Final image name and labels
LABEL org.opencontainers.image.source="https://github.com/beardedtek/newsfeed"
LABEL org.opencontainers.image.description="NewsFeed Nginx Service"
LABEL org.opencontainers.image.title="beardedtek/newsfeed-nginx"
LABEL org.opencontainers.image.version="latest" 