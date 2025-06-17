---
weight: 48
title: "Continuous Integration and Deployment"
---

# Continuous Integration and Deployment

NewsFeed uses GitHub Actions for continuous integration and deployment (CI/CD). This page documents the CI/CD process and how to use it.

## Docker Image Publishing

The main CI/CD workflow builds and publishes Docker images for the NewsFeed application. These images are published to Docker Hub and can be used for deployment.

### Images Published

The workflow builds and publishes the following Docker images:

- `beardedtek/newsfeed-nginx` - The Nginx service with documentation
- `beardedtek/newsfeed` - The frontend service
- `beardedtek/newsfeed-backend` - The backend service

### Tags

Each image is tagged with:

- `:latest` - For the default branch (main)
- `:<branch>` - The branch name (e.g., `main`, `develop`)
- `:<commit>` - The short SHA of the commit

This allows you to use specific versions of the images in your deployment, or always use the latest version.

## Workflow Triggers

The CI/CD workflow is triggered on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Push of version tags (e.g., `v1.0.0`)

Images are only pushed to Docker Hub on push events, not on pull requests. This ensures that only approved changes are published.

## Using the Published Images

To use the published images in your deployment, you can reference them in your `docker-compose.yml` file:

```yaml
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

For production deployments, it's recommended to use a specific version tag instead of `latest`:

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