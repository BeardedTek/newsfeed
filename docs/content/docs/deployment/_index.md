---
weight: 60
title: "Deployment Guides"
bookCollapseSection: true
---

# Deployment Guides

This section provides detailed information on deploying NewsFeed in various environments.

## Docker Deployment

NewsFeed is designed to be deployed using Docker and Docker Compose. The project includes a production-ready `docker-compose.yml` file.

### Prerequisites

- Docker Engine (20.10+)
- Docker Compose (2.0+)
- At least 2GB of RAM
- At least 10GB of disk space

### Basic Deployment Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/beardedtek/newsfeed.git
   cd newsfeed
   ```

2. Set up environment variables:
   ```bash
   # Create environment files from examples
   cp env/frontend.example env/frontend
   cp env/backend.example env/backend
   
   # Edit the environment files with your configuration
   nano env/frontend
   nano env/backend
   ```

3. Create Docker networks:
   ```bash
   docker network create newsfeed
   docker network create casdoor
   ```

4. Start the services:
   ```bash
   docker-compose up -d
   ```

5. Monitor the logs:
   ```bash
   docker-compose logs -f
   ```

### Production Considerations

For production deployments, consider the following:

1. **Security**:
   - Use strong passwords for all services
   - Configure SSL/TLS for all external access
   - Restrict access to admin endpoints

2. **Performance**:
   - Adjust worker concurrency based on available resources
   - Configure appropriate cache settings
   - Consider using a CDN for static assets

3. **Reliability**:
   - Set up monitoring and alerting
   - Configure regular backups
   - Implement health checks

## Reverse Proxy Configuration

NewsFeed is designed to be deployed behind a reverse proxy. The following sections provide configuration examples for popular reverse proxies.

### Nginx

```nginx
server {
    listen 80;
    server_name newsfeed.example.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name newsfeed.example.com;
    
    # SSL configuration
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Proxy to NewsFeed
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Documentation
    location /docs/ {
        proxy_pass http://localhost:80/docs/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Traefik

```yaml
# docker-compose.override.yml
services:
  nginx:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.newsfeed.rule=Host(`newsfeed.example.com`)"
      - "traefik.http.routers.newsfeed.entrypoints=websecure"
      - "traefik.http.routers.newsfeed.tls.certresolver=myresolver"
      - "traefik.http.services.newsfeed.loadbalancer.server.port=80"
```

### Caddy

```
newsfeed.example.com {
    reverse_proxy /* localhost:80
}
```

## Scaling

For larger deployments, consider:

1. **Horizontal Scaling**:
   - Add more worker containers
   - Use a load balancer for frontend/backend services

2. **Database Scaling**:
   - Configure PostgreSQL replication
   - Consider using a managed database service

3. **Cache Optimization**:
   - Increase Redis memory allocation
   - Implement distributed caching

## Backup and Recovery

To back up your NewsFeed instance:

1. **Database Backup**:
   ```bash
   docker-compose exec db pg_dump -U postgres -d newsfeed > backup.sql
   ```

2. **Volume Backup**:
   ```bash
   # Backup thumbnails
   tar -czvf thumbnails-backup.tar.gz /path/to/thumbnails/volume
   ```

3. **Configuration Backup**:
   ```bash
   # Backup environment files
   cp -r env/ env-backup/
   ```

To restore from backup:

1. **Database Restore**:
   ```bash
   cat backup.sql | docker-compose exec -T db psql -U postgres -d newsfeed
   ```

2. **Volume Restore**:
   ```bash
   # Restore thumbnails
   tar -xzvf thumbnails-backup.tar.gz -C /path/to/restore/location
   ```

## Upgrading

To upgrade your NewsFeed instance:

1. Pull the latest changes:
   ```bash
   git pull
   ```

2. Rebuild and restart the services:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

3. Run any necessary migrations:
   ```bash
   docker-compose exec backend python -m app.init_db
   ``` 