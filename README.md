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
- Traefik support (optional)

## Prerequisites

- Docker and Docker Compose
- Running FreshRSS Instance
- Node.js 18+ (for local development)
- Python 3.8+ (for local development)

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
      Edit `env/app`
   ```
   # App configuration
   APP_URL=http://localhost:8880/
   APP_SECRET=asdfkle899839asdjlfiasdf08934
   ```

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

   # Database configuration
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=newsfeed
   POSTGRES_HOST=db
   ```

4. Create docker network
   ```bash
   docker network create newsfeed
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
   - Frontend: http://localhost:8880
   - Backend API: http://localhost:8880/api


## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or email newsfeed@beardedtek.com