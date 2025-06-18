# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the NewsFeed application.

## docker-publish.yml

This workflow builds and publishes Docker images for the NewsFeed application. It is triggered on:

- Pushes to `main` and `dev` branches
- Pushes of tags matching `v*.*.*` (e.g., `v1.0.0`)
- Pull requests to `main` and `dev` branches

### What it does

1. Builds the documentation using Hugo via the `nginx/build-nginx.sh` script
2. Builds the Docker images for all services:
   - `beardedtek/newsfeed-nginx`: Nginx container with documentation
   - `beardedtek/newsfeed`: Frontend Next.js application
   - `beardedtek/newsfeed-backend`: Backend FastAPI application
3. Pushes the images to Docker Hub with appropriate tags (except for pull requests)

### Image Tags

The workflow generates the following tags for each image:

- `latest`: Always points to the most recent build from the main branch
- `<branch-name>`: The name of the branch that triggered the build
- `<commit-sha>`: The first 7 characters of the commit SHA

### Required Secrets

The workflow requires the following secrets to be set in the GitHub repository:

- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: A Docker Hub access token (not your password)

## Integration with Build Scripts

The workflow uses the following build scripts:

1. `nginx/build-nginx.sh`: Builds the nginx image with the documentation site
   - Called directly with the `--push` flag when not a pull request
   - Called with the `--debug` flag to provide more verbose output

2. For the frontend and backend services, it uses Docker's `build-push-action` to build and push the images.

## Local vs CI/CD Environment

The build scripts detect whether they're running in a GitHub Actions environment and adjust their behavior accordingly:

- In GitHub Actions, they use environment variables like `GITHUB_REF_NAME` and `GITHUB_SHA`
- Locally, they use git commands to determine branch and commit information

This allows the same scripts to be used both locally and in CI/CD while providing a simplified experience for local development. 