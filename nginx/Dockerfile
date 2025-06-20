# Stage 1: Hugo build
FROM hugomods/hugo:std-0.147.8 AS hugo-builder

# Set working directory
WORKDIR /src

# Copy your Hugo content into /src
COPY docs/ /src

# Build the Hugo site (output goes to /src/public)
RUN hugo --minify

# Stage 2: NGINX to serve the site
FROM nginx:latest

# Copy built site from Stage 1
COPY --from=hugo-builder /src/public /docs/public

# Copy custom nginx config
COPY nginx/proxy.conf /etc/nginx/nginx.conf

# Expose HTTP port
EXPOSE 80
