#!/bin/bash

# Build the Hugo documentation for production
echo "Building Hugo documentation for production..."

# Ensure we're in the docs directory
cd "$(dirname "$0")"

# Create the public directory with proper permissions if it doesn't exist
mkdir -p public
chmod -R 777 public

# Determine if we're running in GitHub Actions
if [ -n "$GITHUB_ACTIONS" ]; then
  # In GitHub Actions, we need to use a different approach for permissions
  USER_ID=$(id -u)
  GROUP_ID=$(id -g)
  
  # Run Hugo build with specific user permissions for GitHub Actions
  docker run --rm \
    -v $(pwd):/project \
    -u $USER_ID:$GROUP_ID \
    ghcr.io/gohugoio/hugo:v0.147.8 --minify
else
  # For local development, use the standard approach
  docker run --rm -v $(pwd):/project ghcr.io/gohugoio/hugo:v0.147.8 --minify
fi

# Make sure the output files are accessible
if [ -d "public" ]; then
  chmod -R 755 public
  echo "Documentation built successfully in public/ directory"
else
  echo "Error: Hugo build failed. The 'public' directory was not created."
  exit 1
fi 