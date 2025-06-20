# Stage 1: Hugo build
FROM ghcr.io/gohugoio/hugo:v0.147.8 AS hugo-builder
USER root
# Copy your Hugo content into /src
COPY docs/ /project

# Build the Hugo site (output goes to /src/public)
RUN ["hugo", "--minify"]

# Stage 2: NGINX to serve the site
FROM nginx:latest

# Copy built site from Stage 1
COPY --from=hugo-builder /project/public /docs/public

# Copy custom nginx config
COPY nginx/proxy.conf /etc/nginx/nginx.conf

# Expose HTTP port
EXPOSE 80
