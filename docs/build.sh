#!/bin/bash

# Build the Hugo documentation for production
echo "Building Hugo documentation for production..."

# Ensure we're in the docs directory
cd "$(dirname "$0")"

# Run Hugo build
docker run --rm -v $(pwd):/project ghcr.io/gohugoio/hugo:v0.147.8 --minify

echo "Documentation built successfully in public/ directory" 