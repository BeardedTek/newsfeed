---
weight: 3
title: "Nginx Configuration"
---

# Nginx Configuration

NewsFeed uses a custom Nginx container that serves as a reverse proxy for the frontend and backend services, as well as hosting the documentation site.

## Overview

The Nginx configuration is defined in `nginx/proxy.conf` and is used to:

1. Serve the documentation site at `/docs/`
2. Proxy API requests to the backend service
3. Proxy all other requests to the frontend service
4. Serve thumbnail images from a shared volume

## Key Features

- **Pre-built documentation**: Documentation is built before the Docker image
- **Performance optimizations**: Increased worker connections, file descriptors, and TCP optimizations
- **Security enhancements**: Runs as non-root user, includes security headers
- **Health checks**: Automatic monitoring of service health

## Running as Non-Root User

For security reasons, the Nginx container runs as the `nginx` user (non-root). This requires some special configuration:

1. Log files are stored in `/tmp/` instead of `/var/log/nginx/`
2. The PID file is stored in `/tmp/nginx.pid` instead of `/var/run/nginx.pid`
3. Appropriate permissions are set for these directories in the Dockerfile

This configuration helps improve security by reducing the privileges of the Nginx process.

## Custom Build Process

The Nginx image uses a custom build process defined in `nginx/build-nginx.sh`. This script:

1. Builds the documentation using Hugo
2. Builds the Docker image with the pre-built documentation
3. Optionally pushes the image to Docker Hub

To build the Nginx image:

```bash
# Build the nginx image
./nginx/build-nginx.sh

# Build and push to Docker Hub
./nginx/build-nginx.sh --push
```

Alternatively, you can use the unified build script:

```bash
# Build only the nginx image
./build.sh --nginx-only

# Build and push to Docker Hub
./build.sh --nginx-only --push
```

## Configuration Details

### Proxy Configuration

The main proxy configuration in `nginx/proxy.conf` defines how requests are routed:

```nginx
# Serve documentation
location /docs/ {
    alias /docs/public/;
    index index.html;
    autoindex off;
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
    # ... proxy headers ...
}

# Proxy everything else to frontend
location / {
    proxy_pass         http://frontend/;
    # ... proxy headers ...
}
```

### Performance Optimizations

The Nginx configuration includes several performance optimizations:

```nginx
# Performance optimizations
sendfile        on;
tcp_nopush      on;
tcp_nodelay     on;
keepalive_timeout  65;
client_max_body_size 10M;
gzip  on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

Additionally, the Dockerfile increases the worker connections and file descriptors:

```dockerfile
RUN echo "worker_rlimit_nofile 65535;" >> /etc/nginx/nginx.conf && \
    sed -i 's/worker_connections  1024/worker_connections  4096/' /etc/nginx/nginx.conf
```

### Security Headers

The configuration includes several security headers:

```nginx
# Security headers
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Customization

To customize the Nginx configuration:

1. Edit the `nginx/proxy.conf` file
2. Rebuild the Nginx image using `./nginx/build-nginx.sh` or `./build.sh --nginx-only`
3. Restart the container

For advanced customization, you may need to modify the `nginx/Dockerfile` as well. 