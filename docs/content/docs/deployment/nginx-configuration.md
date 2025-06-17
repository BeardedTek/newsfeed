---
weight: 47
title: "Nginx Configuration"
---

# Nginx Configuration

NewsFeed uses Nginx as a reverse proxy to route requests to the appropriate services and to serve static content. This page documents the Nginx configuration and optimizations.

## Multi-Stage Docker Build

The Nginx service uses a multi-stage Docker build to optimize the image size and build process:

1. **Documentation Build Stage**: Builds the Hugo documentation
2. **Nginx Base Stage**: Sets up the base Nginx configuration
3. **Production Stage**: Creates the final optimized image

```dockerfile
# ---- Hugo Documentation Build Stage ----
FROM ghcr.io/gohugoio/hugo:v0.147.8 AS docs-builder
# ... builds the documentation

# ---- Nginx Base Stage ----
FROM nginx:stable-alpine AS nginx-base
# ... installs dependencies

# ---- Production Stage ----
FROM nginx-base AS production
# ... creates the final image
```

## Nginx Configuration

The Nginx configuration is structured to efficiently route requests and serve static content:

### Worker Configuration

```nginx
user  nginx;
worker_processes  auto;
worker_rlimit_nofile 65535;

events {
    worker_connections  4096;
}
```

- `worker_processes auto`: Automatically sets the number of worker processes based on CPU cores
- `worker_rlimit_nofile 65535`: Increases the file descriptor limit
- `worker_connections 4096`: Increases the maximum number of simultaneous connections

### HTTP Configuration

```nginx
http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Performance optimizations
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;
    client_max_body_size 10M;
    gzip  on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Upstream Configuration

```nginx
# Upstream for backend
upstream backend {
    server backend:8001;
}

# Upstream for frontend app
upstream frontend {
    server frontend:3000;
}
```

### Server Configuration

```nginx
server {
    listen 80;
    server_name _;
    
    # Support for proxy headers
    real_ip_header X-Forwarded-For;
    set_real_ip_from 0.0.0.0/0;
    
    # Serve documentation
    location /docs/ {
        alias /docs/public/;
        try_files $uri $uri/ /docs/index.html;
        add_header Cache-Control "public, max-age=3600";
    }
    
    # Serve thumbnails as static files
    location /thumbnails/ {
        alias /thumbnails/;
        add_header Cache-Control "public, max-age=86400";
        try_files $uri =404;
    }

    # Proxy /api to backend
    location /api/ {
        proxy_pass         http://backend/api/;
        # ... proxy headers
    }

    # Proxy everything else to frontend
    location / {
        proxy_pass         http://frontend/;
        # ... proxy headers
    }
}
```

## Performance Optimizations

The Nginx configuration includes several performance optimizations:

### Gzip Compression

```nginx
gzip  on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

This reduces the size of transmitted data, improving load times.

### Static File Caching

```nginx
location /docs/ {
    add_header Cache-Control "public, max-age=3600";
}

location /thumbnails/ {
    add_header Cache-Control "public, max-age=86400";
}
```

Caching static files reduces server load and improves client performance.

### TCP Optimizations

```nginx
sendfile        on;
tcp_nopush      on;
tcp_nodelay     on;
```

These settings optimize TCP packet handling for better performance.

### Connection Handling

```nginx
keepalive_timeout  65;
```

Keeps connections open for 65 seconds, reducing the overhead of establishing new connections.

## Security Enhancements

### Non-Root User

The Nginx service runs as a non-root user for improved security:

```dockerfile
# Create non-root user for nginx
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Use non-root user
USER nginx
```

### Security Headers

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

These headers protect against common web vulnerabilities.

## Health Checks

The Nginx service includes a health check to ensure it's functioning correctly:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/docs/ || exit 1
```

This checks if the documentation is being served correctly every 30 seconds.

## Docker Compose Integration

The `docker-compose.yml` file is configured to build and run the Nginx service:

```yaml
nginx:
  image: beardedtek/newsfeed-nginx:latest
  build:
    context: .
    dockerfile: nginx/Dockerfile
    target: production
  ports:
    - "8880:80"
  volumes:
    - thumbnails:/thumbnails:ro
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost/docs/"]
    interval: 30s
    timeout: 5s
    retries: 3
    start_period: 10s
```

## Customizing the Configuration

To customize the Nginx configuration:

1. Edit the `nginx/proxy.conf` file
2. Rebuild the Nginx image:
   ```bash
   docker-compose build nginx
   ```
3. Restart the service:
   ```bash
   docker-compose restart nginx
   ```

## Best Practices

- Regularly update the Nginx base image for security patches
- Monitor Nginx logs for errors or performance issues
- Adjust worker connections and processes based on server resources
- Consider adding rate limiting for production deployments 