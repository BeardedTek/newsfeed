# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the NewsFeed application.

## docker-publish.yml

This workflow builds and publishes Docker images for the NewsFeed application. It is triggered on:

- Pushes to `main` and `dev` branches
- Pushes of tags matching `v*.*.*` (e.g., `v1.0.0`)
- Pull requests to `main` and `dev` branches

### What it does

1. Builds the Docker images for all services using multi-stage builds:
   - `beardedtek/newsfeed-nginx`: Nginx container with documentation (built using Hugo in the first stage)
   - `beardedtek/newsfeed`: Frontend Next.js application
   - `beardedtek/newsfeed-backend`: Backend FastAPI application
2. Pushes the images to Docker Hub with appropriate tags (except for pull requests)

### Image Tags

The workflow generates the following tags for each image:

- `latest`: Always points to the most recent build from the main branch
- `<branch-name>`: The name of the branch that triggered the build
- `<commit-sha>`: The first 7 characters of the commit SHA

### Required Secrets

The workflow requires the following secrets to be set in the GitHub repository:

- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: A Docker Hub access token (not your password)

## deploy-docs.yml

This workflow builds and deploys the documentation to GitHub Pages. It is triggered on:

- Pushes to the `main` branch that include changes to the `docs/` directory
- Manual triggering via the GitHub Actions UI

### What it does

1. Modifies the Hugo configuration for GitHub Pages deployment
2. Builds the documentation using Hugo
3. Deploys the built site to GitHub Pages

## Skipping Workflows

You can skip workflows by including specific phrases in your commit messages:

- `NO_CICD`: Skips all CI/CD workflows
- `NO_CICD_DOCKER`: Skips only the Docker build and publish workflow
- `NO_CICD_DOCS`: Skips only the documentation deployment workflow

Examples:
```
git commit -m "Update README [NO_CICD]"  # Skips all workflows
git commit -m "Fix typo in docs [NO_CICD_DOCKER]"  # Only skips Docker workflow
git commit -m "Update Docker config [NO_CICD_DOCS]"  # Only skips docs workflow
```

## Docker Build Process

The workflow uses Docker's `build-push-action` to build and push all images, including:

1. Nginx image with the documentation site built using a multi-stage Dockerfile
2. Frontend Next.js application
3. Backend FastAPI application

Each image is built directly from its respective Dockerfile, without the need for additional build scripts.

## Local vs CI/CD Environment

For local development, you can use Docker Compose to build and run the services:

```bash
# Build all services
docker compose build

# Start all services
docker compose up -d
```

The same Docker Compose configuration is used both locally and in CI/CD, providing a consistent experience across environments. 

NOTE: reverted back to 54966bdb4fee0e9e1b7ff72b3d0ce708e1ce0eaf