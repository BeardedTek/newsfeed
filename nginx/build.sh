#!/bin/bash

# Build and test the nginx container

# Set the working directory to the project root
cd "$(dirname "$0")/.."

echo "Building the nginx container..."
docker build -t beardedtek/newsfeed-nginx:latest -f nginx/Dockerfile .

if [ $? -ne 0 ]; then
    echo "Error: Failed to build the nginx container."
    exit 1
fi

echo "Successfully built beardedtek/newsfeed-nginx:latest"

# Test the container
echo "Testing the nginx container..."

# Run the container in detached mode
docker run --name newsfeed-nginx-test -d -p 8880:80 beardedtek/newsfeed-nginx:latest

# Wait for container to start
sleep 3

# Test if the docs are accessible
echo "Testing if docs are accessible..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8880/docs/

if [ $? -ne 0 ]; then
    echo "Error: Failed to access the docs."
    docker stop newsfeed-nginx-test
    docker rm newsfeed-nginx-test
    exit 1
fi

echo "Docs are accessible."

# Stop and remove the container
docker stop newsfeed-nginx-test
docker rm newsfeed-nginx-test

echo "Nginx container test completed successfully."
echo "You can now use the container with docker-compose up -d" 