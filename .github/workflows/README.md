# Docker Publish Workflow

This GitHub Actions workflow automatically builds and publishes Docker images for the NewsFeed application.

## Images Published

The workflow builds and publishes the following Docker images:

- `beardedtek/newsfeed-nginx` - The Nginx service with documentation
- `beardedtek/newsfeed` - The frontend service
- `beardedtek/newsfeed-backend` - The backend service

## Tags

Each image is tagged with:

- `:latest` - For the default branch (main)
- `:<branch>` - The branch name (e.g., `main`, `develop`)
- `:<commit>` - The short SHA of the commit

## Setup

To use this workflow, you need to set up the following secrets in your GitHub repository:

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

## Workflow Triggers

The workflow is triggered on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Push of version tags (e.g., `v1.0.0`)

Note that images are only pushed to Docker Hub on push events, not on pull requests.

## Customization

You can customize this workflow by:

- Adding more branches to the trigger list
- Changing the tag format
- Adding more Docker images
- Adding build arguments
- Configuring additional platforms (e.g., for multi-architecture builds)

## Caching

The workflow uses GitHub's cache to speed up builds. Docker layers are cached between runs, which significantly reduces build time. 