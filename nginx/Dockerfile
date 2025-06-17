# ---- Nginx Base Stage ----
FROM nginx:stable-alpine AS nginx-base

# Install required packages for performance optimization
RUN apk add --no-cache curl tzdata

# Configure timezone
ENV TZ=UTC

# Create directories
RUN mkdir -p /thumbnails /docs/public

# ---- Production Stage ----
FROM nginx-base AS production

# Copy the pre-built documentation
COPY docs/public/ /docs/public/

# Copy nginx configuration
COPY nginx/proxy.conf /etc/nginx/nginx.conf

# Copy static files
COPY frontend/public/favicon.ico /usr/share/nginx/html/favicon.ico

# Performance tuning and permissions
RUN echo "worker_rlimit_nofile 65535;" >> /etc/nginx/nginx.conf && \
    sed -i 's/worker_connections  1024/worker_connections  4096/' /etc/nginx/nginx.conf && \
    mkdir -p /tmp && \
    chown -R nginx:nginx /var/cache/nginx /docs /thumbnails /tmp && \
    chmod -R 755 /docs/public && \
    chmod -R 755 /thumbnails && \
    touch /tmp/nginx.pid /tmp/nginx_error.log /tmp/nginx_access.log && \
    chown -R nginx:nginx /tmp/nginx* && \
    chmod -R 755 /tmp/nginx*

# Debug: List contents of docs directory
RUN ls -la /docs/public || echo "Public directory not found"

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/docs/ || exit 1

# Expose port
EXPOSE 80

# Use non-root user
USER nginx

# Final image name and labels
LABEL org.opencontainers.image.source="https://github.com/beardedtek/newsfeed"
LABEL org.opencontainers.image.description="NewsFeed Nginx Service"
LABEL org.opencontainers.image.title="beardedtek/newsfeed-nginx"
LABEL org.opencontainers.image.version="latest" 