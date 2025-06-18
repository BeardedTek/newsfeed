#!/bin/bash

# Build script for the nginx container
# This script builds the Hugo documentation and then builds the Docker image

set -e

# Parse command line arguments
PUSH_IMAGES=false
DEBUG=false

for arg in "$@"; do
    case $arg in
        --push)
            PUSH_IMAGES=true
            ;;
        --debug)
            DEBUG=true
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --push       Push images to Docker Hub after building"
            echo "  --debug      Enable debug output"
            echo "  --help       Show this help message"
            exit 0
            ;;
    esac
done

# Set variables
NGINX_IMAGE_NAME="beardedtek/newsfeed-nginx"
CURRENT_DIR=$(pwd)

# Debug information
if [ "$DEBUG" = true ]; then
    echo "Debug: Current directory: $CURRENT_DIR"
    echo "Debug: Environment variables:"
    env | sort
fi

# Determine if we're in a GitHub Actions environment
IN_GITHUB_ACTIONS=${GITHUB_ACTIONS:-false}

# Build the documentation
echo "Building Hugo documentation..."
cd "$(dirname "$0")/../docs" || exit 1
if ! ./build.sh; then
    echo "Error: Documentation build failed."
    exit 1
fi

# Check if the documentation was built successfully
if [ ! -d "public" ]; then
    echo "Error: Documentation build failed. The 'docs/public' directory does not exist."
    exit 1
fi

# Debug information
if [ "$DEBUG" = true ]; then
    echo "Debug: Contents of docs/public directory:"
    ls -la public/
fi

echo "Documentation built successfully."

# Create a temporary directory for the build context
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy the necessary files to the temporary directory
mkdir -p $TEMP_DIR/docs
cp -r public $TEMP_DIR/docs/

# Go back to the project root
cd "$(dirname "$0")/.." || exit 1

# Copy nginx files
cp -r nginx $TEMP_DIR/

# Copy favicon
mkdir -p $TEMP_DIR/frontend/public
cp -r frontend/public/favicon.ico $TEMP_DIR/frontend/public/ 2>/dev/null || echo "Warning: favicon.ico not found"

# Build the nginx image
echo "Building nginx image..."

# Add tags based on environment
TAGS="-t $NGINX_IMAGE_NAME:latest"

if [ "$IN_GITHUB_ACTIONS" = "true" ]; then
    # In GitHub Actions, add branch and commit tags
    BRANCH_NAME=${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}
    COMMIT_SHA=${GITHUB_SHA:-$(git rev-parse --short HEAD)}
    
    TAGS="$TAGS -t $NGINX_IMAGE_NAME:$BRANCH_NAME -t $NGINX_IMAGE_NAME:$COMMIT_SHA"
    
    if [ "$DEBUG" = true ]; then
        echo "Debug: Building for GitHub Actions"
        echo "Debug: Branch: $BRANCH_NAME"
        echo "Debug: Commit: $COMMIT_SHA"
    fi
fi

# Build the image
echo "Running: docker build $TAGS -f nginx/Dockerfile $TEMP_DIR"
docker build $TAGS -f nginx/Dockerfile $TEMP_DIR

if [ $? -ne 0 ]; then
    echo "Error: Failed to build nginx image."
    exit 1
fi

echo "Nginx image built successfully!"

# Push images if requested
if [ "$PUSH_IMAGES" = true ]; then
    echo "Pushing images to Docker Hub..."
    docker push "$NGINX_IMAGE_NAME:latest"
    
    if [ "$IN_GITHUB_ACTIONS" = "true" ]; then
        docker push "$NGINX_IMAGE_NAME:$BRANCH_NAME"
        docker push "$NGINX_IMAGE_NAME:$COMMIT_SHA"
    fi
    
    echo "Images pushed successfully!"
fi

exit 0 