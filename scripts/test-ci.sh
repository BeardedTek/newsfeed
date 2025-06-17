#!/bin/bash

# Test script for CI workflow
# This script builds the Docker images locally using the same process as the CI workflow

set -e

# Set variables
NGINX_IMAGE_NAME="beardedtek/newsfeed-nginx"
FRONTEND_IMAGE_NAME="beardedtek/newsfeed"
BACKEND_IMAGE_NAME="beardedtek/newsfeed-backend"

# Get the current branch name
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
COMMIT_SHA=$(git rev-parse --short HEAD)

echo "Building images for branch: $BRANCH_NAME, commit: $COMMIT_SHA"

# Build nginx image
echo "Building nginx image..."
docker build -t "$NGINX_IMAGE_NAME:latest" \
             -t "$NGINX_IMAGE_NAME:$BRANCH_NAME" \
             -t "$NGINX_IMAGE_NAME:$COMMIT_SHA" \
             -f nginx/Dockerfile .

# Build frontend image
echo "Building frontend image..."
docker build -t "$FRONTEND_IMAGE_NAME:latest" \
             -t "$FRONTEND_IMAGE_NAME:$BRANCH_NAME" \
             -t "$FRONTEND_IMAGE_NAME:$COMMIT_SHA" \
             -f frontend/Dockerfile ./frontend

# Build backend image
echo "Building backend image..."
docker build -t "$BACKEND_IMAGE_NAME:latest" \
             -t "$BACKEND_IMAGE_NAME:$BRANCH_NAME" \
             -t "$BACKEND_IMAGE_NAME:$COMMIT_SHA" \
             --target production \
             -f backend/Dockerfile ./backend

echo "All images built successfully!"
echo ""
echo "To push these images to Docker Hub, run:"
echo "  docker push $NGINX_IMAGE_NAME:latest"
echo "  docker push $NGINX_IMAGE_NAME:$BRANCH_NAME"
echo "  docker push $NGINX_IMAGE_NAME:$COMMIT_SHA"
echo "  docker push $FRONTEND_IMAGE_NAME:latest"
echo "  docker push $FRONTEND_IMAGE_NAME:$BRANCH_NAME"
echo "  docker push $FRONTEND_IMAGE_NAME:$COMMIT_SHA"
echo "  docker push $BACKEND_IMAGE_NAME:latest"
echo "  docker push $BACKEND_IMAGE_NAME:$BRANCH_NAME"
echo "  docker push $BACKEND_IMAGE_NAME:$COMMIT_SHA" 