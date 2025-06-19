# NewsFeed

A modern news aggregation and personalization platform built with Next.js, FastAPI, and Docker. This application provides a seamless experience for users to discover, read, and organize news content from various sources.

## Features

- Real-time news aggregation and updates
- User authentication and personalization (via Casdoor)
- RSS feed integration (via FreshRSS)
- AI-powered content categorization and recommendations
- Responsive and modern UI built with Flowbite and Tailwind CSS
- Background task processing with Celery
- Redis caching for improved performance
- PostgreSQL database for persistent storage

## Demo

[https://newsfeed.beardedtek.net](https://newsfeed.beardedtek.net)

## Project Structure

The project is organized into separate components:

```
newsfeed/
├── frontend/        # Next.js frontend application
├── backend/         # FastAPI backend application
├── casdoor/         # Casdoor authentication service configuration
├── nginx/           # Nginx reverse proxy configuration
├── env/             # Environment variable files
├── docs/            # Documentation website
└── utils/           # Utility scripts
```

## Documentation

The project includes comprehensive documentation built with Hugo. When the application is running, the documentation is available at `/docs/` (e.g., <http://localhost/docs/>).

To build the documentation:

```bash
cd docs
./build.sh
```

For more information about the documentation, see [docs/README.md](docs/README.md).

## Tech Stack

### Frontend

- Next.js 14
- React 18
- Material-UI
- Tailwind CSS
- TypeScript

### Backend

- FastAPI
- Celery
- Redis
- PostgreSQL
- Docker

### Infrastructure

- Docker & Docker Compose
- Nginx for reverse proxy

## Prerequisites

- Docker and Docker Compose
- Running FreshRSS Instance
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

## Quick Start

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/newsfeed.git
   cd newsfeed
   ```

2. Set up FreshRSS for API Access
   On your already running instance of FreshRSS:
      - Click the settings `gear` icon
      - Click `Profile`
      - Enter an API password under `External access via API`
      - Save this password for the next step

3. Set up environment variables:
      Edit `env/frontend`

   ```
   # App configuration
   APP_URL=http://localhost:8880/
   APP_SECRET=asdfkle899839asdjlfiasdf08934
   
   # Contact Form
   CONTACT_FORM_ACTION=https://formspree.io/f/your-form-id
   
   # Casdoor configuration
   CASDOOR_SERVER_URL=http://localhost:8000
   CASDOOR_CLIENT_ID=your-client-id
   CASDOOR_CLIENT_SECRET=your-client-secret
   CASDOOR_APP_NAME=newsfeed
   CASDOOR_ORG_NAME=newsfeed
   CASDOOR_REDIRECT_URI=http://localhost:8880/callback
   ```

   > **Note:** The frontend environment variables are automatically mapped to include the `NEXT_PUBLIC_` prefix at runtime, so you don't need to include it in your environment files.

   Edit `env/backend`
   Make sure you enter your own already running instance of FreshRSS.

   ```
   # Backend and worker configuration
   REDIS_URL=redis://redis:6379/0
   FRESHRSS_URL=https://freshrss.example.com
   FRESHRSS_API_USER=newsfeed
   FRESHRSS_API_PASSWORD=newsfeed
   OLLAMA_URL=http://ollama:11434
   OLLAMA_MODEL=LLAMA3.2:3B

   # Worker configuration
   WORKER_PROCESS_ARTICLES_INTERVAL=15       # How often to process articles (in minutes)
   WORKER_PURGE_OLD_ARTICLES_INTERVAL=1440   # How often to purge old articles (in minutes, default 24 hours)
   WORKER_ENRICH_ARTICLES_INTERVAL=60        # How often to enrich articles (in minutes, default 1 hour)
   WORKER_FRESHRSS_FETCH_LIMIT=100           # Maximum articles to fetch per batch
   WORKER_CONCURRENT_FRESHRSS_FETCH_TASKS=1  # Number of concurrent fetch tasks
   WORKER_FRESHRSS_FETCH_DAYS=3              # Number of days to fetch articles from
   WORKER_FRESHRSS_PURGE_NUM_DAYS_TO_KEEP=7  # Number of days to keep articles before purging
   WORKER_TASK_TIME_LIMIT=300                # Maximum time a task can run (in seconds)
   WORKER_SOFT_TIME_LIMIT=240                # Soft time limit for tasks (in seconds)
   WORKER_MAX_TASKS_PER_CHILD=100            # Maximum number of tasks a worker process can execute before being replaced
   WORKER_MAX_MEMORY_PER_CHILD=200000        # Maximum memory usage (in KB) before worker is replaced
   WORKER_PREFETCH_MULTIPLIER=1              # Number of tasks to prefetch per worker

   # Database configuration
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=newsfeed
   POSTGRES_HOST=db
   ```

4. Create docker networks

   ```bash
   docker network create newsfeed
   docker network create casdoor
   ```

5. Start the services:

   ```bash
   docker-compose up --build
   ```

6. View docker logs to make sure everything is working

   ```bash
   docker compose logs -f
   ```

7. Access the application:
   - Frontend: <http://localhost:8880>
   - Backend API: <http://localhost:8880/api>
   - Documentation: <http://localhost:8880/docs>

## Production Deployment

The docker-compose.yml file is configured for production use with:

- Optimized service configurations with multi-stage Docker builds
- Non-root user execution for improved security
- Comprehensive health checks for all services
- Proper logging with rotation
- Improved performance settings
- Proper dependency chains between services

For production deployment:

1. Update environment variables with production values
2. Configure your external proxy server to forward traffic to the Nginx service
3. Deploy using:

   ```bash
   docker-compose up -d
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or email <newsfeed@beardedtek.com>

## Building and Running

### Local Development

For local development, use Docker Compose:

```bash
# Build all images
docker compose build

# Start all services
docker compose up -d

# Build and start a specific service
docker compose up -d --build nginx
```

### Simplified Nginx Build Process

The Nginx image uses a multi-stage build process that:

1. Builds the documentation using Hugo in the first stage
2. Serves the application and documentation with Nginx in the second stage

This approach simplifies deployment by eliminating the need for separate build scripts.

### CI/CD

The project includes GitHub Actions workflows for continuous integration and deployment. See the [CI/CD documentation](docs/content/docs/deployment/ci-cd.md) for more information.
