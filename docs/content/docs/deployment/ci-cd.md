---
weight: 5
title: "CI/CD"
---

# Continuous Integration and Deployment

NewsFeed includes a GitHub Actions workflow for continuous integration and deployment. This workflow automatically builds and publishes Docker images for the NewsFeed application.

## GitHub Actions Workflow

The GitHub Actions workflow is defined in `.github/workflows/docker-build.yml` and performs the following tasks:

1. Builds the documentation using Hugo
2. Builds the Docker images for all services
3. Pushes the images to Docker Hub with appropriate tags

### Image Tags

The workflow generates the following tags for each image:

- `latest`: Always points to the most recent build from the main branch
- `<branch-name>`: The name of the branch that triggered the build
- `<commit-sha>`: The first 7 characters of the commit SHA

### Docker Images

The following Docker images are built and published:

- `beardedtek/newsfeed-nginx`: The Nginx container that serves the documentation and acts as a reverse proxy
- `beardedtek/newsfeed`: The frontend Next.js application
- `beardedtek/newsfeed-backend`: The backend FastAPI application (used for both the API and worker containers)

## Build Process

The build process uses the `build.sh` script at the project root, which provides a unified interface for building all services. For the nginx service, a custom build process is used via the `nginx/build-nginx.sh` script.

### Custom Nginx Build

The nginx image requires a special build process because it includes the documentation site. The `nginx/build-nginx.sh` script:

1. Builds the documentation using Hugo
2. Builds the Docker image with the pre-built documentation
3. Optionally pushes the image to Docker Hub

## Local Development

For local development, you can use the same build scripts:

```bash
# Build all images
./build.sh

# Build and start services
./build.sh --up

# Build and start services in detached mode
./build.sh -d
```

## Production Deployment

For production deployment, you can use the pre-built images from Docker Hub:

```yaml
# In docker-compose.yml
services:
  nginx:
    image: beardedtek/newsfeed-nginx:latest
    # ...

  frontend:
    image: beardedtek/newsfeed:latest
    # ...

  backend:
    image: beardedtek/newsfeed-backend:latest
    # ...
```

For production environments, it's recommended to use specific version tags instead of `latest` to ensure consistency:

```yaml
services:
  nginx:
    image: beardedtek/newsfeed-nginx:v1.0.0
  # ...
```

## Setting Up CI/CD for Your Fork

If you fork the NewsFeed repository, you'll need to set up the following secrets in your GitHub repository to enable the CI/CD workflow:

1. `DOCKERHUB_USERNAME` - Your Docker Hub username
2. `DOCKERHUB_TOKEN` - A Docker Hub access token (not your password)

### Creating a Docker Hub Access Token

1. Log in to [Docker Hub](https://hub.docker.com/)
2. Go to Account Settings > Security
3. Click "New Access Token"
4. Give it a name (e.g., "GitHub Actions")
5. Copy the token and add it as a secret in your GitHub repository

### Adding Secrets to GitHub

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add the following secrets:
   - Name: `DOCKERHUB_USERNAME`, Value: Your Docker Hub username
   - Name: `DOCKERHUB_TOKEN`, Value: Your Docker Hub access token

## Customizing the CI/CD Workflow

The CI/CD workflow is defined in the `.github/workflows/docker-publish.yml` file. You can customize it to suit your needs, such as:

- Adding more branches to the trigger list
- Changing the tag format
- Adding more Docker images
- Adding build arguments
- Configuring additional platforms (e.g., for multi-architecture builds)

## Automated Deployments

Currently, the CI/CD workflow only builds and publishes Docker images. It does not automatically deploy them to any environment. You can extend the workflow to deploy to your environment by adding additional steps to the workflow.

For example, to deploy to a server using SSH:

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USERNAME }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      cd /path/to/newsfeed
      docker-compose pull
      docker-compose up -d
```

This would require additional secrets:
- `SSH_HOST` - The hostname or IP address of your server
- `SSH_USERNAME` - The username to use for SSH
- `SSH_PRIVATE_KEY` - The private key to use for SSH authentication 