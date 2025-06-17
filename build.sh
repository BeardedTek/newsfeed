#!/bin/bash

# Build script for the NewsFeed application
# This script builds all the Docker images, including the nginx image using the custom build script

set -e

# Find the project root directory
find_project_root() {
    local current_dir="$PWD"
    while [[ "$current_dir" != "/" ]]; do
        if [[ -f "$current_dir/docker-compose.yml" ]]; then
            echo "$current_dir"
            return 0
        fi
        current_dir="$(dirname "$current_dir")"
    done
    echo "Error: Could not find project root directory" >&2
    return 1
}

PROJECT_ROOT=$(find_project_root)
if [[ $? -ne 0 ]]; then
    exit 1
fi

cd "$PROJECT_ROOT"

# Default values
NGINX_ONLY=false
NO_NGINX=false
PUSH=false
UP=false
DETACHED=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --nginx-only)
            NGINX_ONLY=true
            shift
            ;;
        --no-nginx)
            NO_NGINX=true
            shift
            ;;
        --push)
            PUSH=true
            shift
            ;;
        --up)
            UP=true
            shift
            ;;
        -d)
            DETACHED=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--nginx-only] [--no-nginx] [--push] [--up] [-d]"
            exit 1
            ;;
    esac
done

# Check for conflicting options
if $NGINX_ONLY && $NO_NGINX; then
    echo "Error: Cannot specify both --nginx-only and --no-nginx"
    exit 1
fi

# Build the nginx image
if ! $NO_NGINX; then
    NGINX_CMD="./nginx/build-nginx.sh"
    if $PUSH; then
        NGINX_CMD="$NGINX_CMD --push"
    fi
    echo "Building nginx image with command: $NGINX_CMD"
    eval "$NGINX_CMD"
    if [[ $? -ne 0 ]]; then
        echo "Error: Failed to build nginx image"
        exit 1
    fi
fi

# Build other services if not nginx-only
if ! $NGINX_ONLY; then
    # Build other services using docker compose
    COMPOSE_CMD="docker compose build"
    if $PUSH; then
        COMPOSE_CMD="$COMPOSE_CMD && docker compose push"
    fi
    echo "Building other services with command: $COMPOSE_CMD"
    eval "$COMPOSE_CMD"
    if [[ $? -ne 0 ]]; then
        echo "Error: Failed to build other services"
        exit 1
    fi
fi

# Start services if requested
if $UP; then
    UP_CMD="docker compose up"
    if $DETACHED; then
        UP_CMD="$UP_CMD -d"
    fi
    echo "Starting services with command: $UP_CMD"
    eval "$UP_CMD"
fi

echo "Build completed successfully!"
exit 0 