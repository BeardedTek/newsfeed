#!/bin/bash

# Build script for the nginx container
# This script builds the Hugo documentation and then builds the Docker image

set -e

# Parse command line arguments
DRY_RUN=false
PUSH_IMAGES=false

for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            ;;
        --push)
            PUSH_IMAGES=true
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --dry-run    Build images but don't push them"
            echo "  --push       Push images to Docker Hub after building"
            echo "  --help       Show this help message"
            exit 0
            ;;
    esac
done

# Function to find the project root directory
find_project_root() {
    # Start with the current directory
    local dir=$(pwd)
    
    # Check if we're already in the project root
    if [[ "$(basename "$dir")" == "newsfeed" && -d "$dir/docs" && -d "$dir/nginx" && -f "$dir/docker-compose.yml" ]]; then
        echo "$dir"
        return 0
    fi
    
    # Check if we're in the nginx directory
    if [[ "$(basename "$dir")" == "nginx" && -d "$dir/../docs" && -f "$dir/../docker-compose.yml" ]]; then
        echo "$(cd "$dir/.." && pwd)"
        return 0
    fi
    
    # Check if we're in the docs directory
    if [[ "$(basename "$dir")" == "docs" && -d "$dir/../nginx" && -f "$dir/../docker-compose.yml" ]]; then
        echo "$(cd "$dir/.." && pwd)"
        return 0
    fi
    
    # Try to find the project root by going up directories
    while [[ "$dir" != "/" ]]; do
        if [[ "$(basename "$dir")" == "newsfeed" && -d "$dir/docs" && -d "$dir/nginx" && -f "$dir/docker-compose.yml" ]]; then
            echo "$dir"
            return 0
        fi
        dir=$(dirname "$dir")
    done
    
    # If we get here, we couldn't find the project root
    return 1
}

# Find the project root
PROJECT_ROOT=$(find_project_root)
if [[ $? -ne 0 ]]; then
    echo "Error: Could not find project root directory."
    echo "Please run this script from the project root or one of its subdirectories."
    exit 1
fi

# Navigate to the project root
cd "$PROJECT_ROOT"
echo "Working from project root: $PROJECT_ROOT"

# Set variables
NGINX_IMAGE_NAME="beardedtek/newsfeed-nginx"
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
COMMIT_SHA=$(git rev-parse --short HEAD)

echo "Building nginx image for branch: $BRANCH_NAME, commit: $COMMIT_SHA"

# Build the documentation
echo "Building Hugo documentation..."
cd docs
./build.sh
cd ..

# Check if the documentation was built successfully
if [ ! -d "docs/public" ]; then
    echo "Error: Documentation build failed. The 'docs/public' directory does not exist."
    exit 1
fi

echo "Documentation built successfully."

# Build the nginx image
echo "Building nginx image..."
docker build -t "$NGINX_IMAGE_NAME:latest" \
             -t "$NGINX_IMAGE_NAME:$BRANCH_NAME" \
             -t "$NGINX_IMAGE_NAME:$COMMIT_SHA" \
             -f nginx/Dockerfile .

echo "Nginx image built successfully!"

# Push images if requested
if [ "$PUSH_IMAGES" = true ]; then
    echo "Pushing images to Docker Hub..."
    docker push "$NGINX_IMAGE_NAME:latest"
    docker push "$NGINX_IMAGE_NAME:$BRANCH_NAME"
    docker push "$NGINX_IMAGE_NAME:$COMMIT_SHA"
    echo "Images pushed successfully!"
else
    echo ""
    echo "To push these images to Docker Hub, run:"
    echo "  docker push $NGINX_IMAGE_NAME:latest"
    echo "  docker push $NGINX_IMAGE_NAME:$BRANCH_NAME"
    echo "  docker push $NGINX_IMAGE_NAME:$COMMIT_SHA"
    echo "Or run this script with the --push flag"
fi 