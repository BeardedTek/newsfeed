#!/bin/bash

# Simplified build script for local development of the NewsFeed application
# This script builds all the Docker images for local deployment

set -e

# Default values
DEBUG=false
DETACHED=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--detached)
            DETACHED=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  -d, --detached   Run containers in detached mode"
            echo "  --debug          Enable debug output"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Debug output
if $DEBUG; then
    echo "Debug mode enabled"
    echo "Current directory: $(pwd)"
    echo "Docker Compose version: $(docker compose version)"
fi

# Build the nginx image for local development
echo "Building nginx image..."
NGINX_CMD="./nginx/build-nginx.sh"
if $DEBUG; then
    NGINX_CMD="$NGINX_CMD --debug"
fi

echo "Running: $NGINX_CMD"
eval "$NGINX_CMD"

if [[ $? -ne 0 ]]; then
    echo "Error: Failed to build nginx image"
    exit 1
fi

# Build other services using docker compose
echo "Building other services..."
docker compose build

if [[ $? -ne 0 ]]; then
    echo "Error: Failed to build other services"
    exit 1
fi

# Start the services
echo "Starting services..."
UP_CMD="docker compose up"
if $DETACHED; then
    UP_CMD="$UP_CMD -d"
fi

echo "Running: $UP_CMD"
eval "$UP_CMD"

echo "Build and deployment completed successfully!"
exit 0 