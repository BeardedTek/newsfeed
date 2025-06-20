---
weight: 5
title: "CI/CD"
---

# Continuous Integration and Deployment

NewsFeed includes a GitHub Actions workflow for continuous integration and deployment. This workflow automatically builds and publishes Docker images for the NewsFeed application.

## GitHub Actions Workflow

The GitHub Actions workflow is defined in `.github/workflows/docker-publish.yml` and performs the following tasks:

1. Builds the Docker images for all services (including documentation in the Nginx image)
2. Pushes the images to Docker Hub with appropriate tags

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

## Documentation Deployment

In addition to the Docker image workflow, there is also a GitHub Actions workflow for deploying the documentation to GitHub Pages. This workflow is defined in `.github/workflows/deploy-docs.yml` and is triggered when changes are made to the `docs/` directory.

The documentation is deployed to GitHub Pages at: https://beardedtek.github.io/newsfeed/

## Skipping CI/CD Workflows

You can control CI/CD workflows by including specific phrases in your commit messages:

### Skip All Workflows

- `NO_CICD`: Skips all CI/CD workflows

### Skip Specific Workflows

- `NO_CICD_DOCKER`: Skips only the Docker build and publish workflow
- `NO_CICD_DOCS`: Skips only the documentation deployment workflow
- `NO_CICD_FRONTEND`: Skips only the frontend Docker build/push
- `NO_CICD_BACKEND`: Skips only the backend Docker build/push
- `NO_CICD_NGINX`: Skips only the nginx Docker build/push

### Run Only Specific Workflows

- `CICD_ONLY_FRONTEND`: Only runs the frontend Docker build/push
- `CICD_ONLY_BACKEND`: Only runs the backend Docker build/push
- `CICD_ONLY_NGINX`: Only runs the nginx Docker build/push
- `CICD_ONLY_DOCS`: Only runs the GitHub Pages documentation deployment

Examples:
```bash
git commit -m "Update README [NO_CICD]"  # Skips all workflows
git commit -m "Fix typo in docs [NO_CICD_DOCKER]"  # Only skips Docker workflow
git commit -m "Update Docker config [NO_CICD_DOCS]"  # Only skips docs workflow
git commit -m "Update frontend only [CICD_ONLY_FRONTEND]"  # Only builds frontend
git commit -m "Fix backend bug [NO_CICD_FRONTEND]"  # Skips frontend build
```

This feature is useful when:
- Making minor documentation changes without triggering a full Docker build
- Testing changes to Docker configurations without triggering documentation deployment
- Skipping all CI/CD for very minor changes or work-in-progress commits
- Building only the components that have changed to save CI/CD time and resources

## Build Process

The build process uses Docker's multi-stage builds to simplify deployment:

1. The Nginx container uses a multi-stage build to generate documentation with Hugo and then serve it with Nginx
2. The frontend and backend containers use their respective Dockerfiles for building
3. All containers can be built together using `docker compose build`

### Simplified Nginx Build

The Nginx image now uses a multi-stage build defined in `nginx/Dockerfile`:

1. First stage uses Hugo to build the documentation
2. Second stage uses Nginx to serve the application and documentation
3. No separate build scripts are needed

## Local Development

For local development, use Docker Compose:

```bash
# Build all images
docker compose build

# Start all services
docker compose up -d

# Build and start a specific service
docker compose up -d --build nginx
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