# NewsFeed

A modern news aggregation platform built with Next.js, FastAPI, and Docker.

## Features

- Real-time news aggregation
- User authentication with Casdoor
- Categorization and related articles
- Responsive design
- Docker-based deployment

## Prerequisites

- Docker and Docker Compose
- Git

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/newsfeed.git
   cd newsfeed
   ```

2. Create an environment file:
   - Copy the example environment file:
   ```bash
     cp env.example env
   ```
   - Edit the `env` file and fill in the required environment variables:
     ```
     # App
     APP_URL=https://newsfeed.${BASE_DOMAIN}
     APP_SECRET=your-app-secret

     # Casdoor
     CASDOOR_ENDPOINT=https://casdoor.example.com
     CASDOOR_CLIENT_ID=your-casdoor-client-id
     CASDOOR_CLIENT_SECRET=your-casdoor-client-secret
     CASDOOR_CERTIFICATE=your-casdoor-certificate

     # Backend
     REDIS_URL=redis://redis:6379/0
     FRESHRSS_URL=your-freshrss-url
     FRESHRSS_API_USER=your-freshrss-api-user
     FRESHRSS_API_PASSWORD=your-freshrss-api-password
     OLLAMA_URL=your-ollama-url
     OLLAMA_MODEL=your-ollama-model

     # Database
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=postgres
     POSTGRES_DB=newsfeed

     # freshrss-db
     FRESHRSS_DB_TYPE=pgsql
     FRESHRSS_DB_HOST=freshrss-db
     FRESHRSS_DB_USER=freshrss
     FRESHRSS_DB_PASSWORD=freshrss
     FRESHRSS_DB_BASE=freshrss

     # casdoor-db
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=postgres
     POSTGRES_DB=casdoor

     # freshrss
     PUID=1000
     PGID=1000
     TZ=UTC

     # BASE_DOMAIN
     BASE_DOMAIN=your-base-domain
     ```

3. Build and start the services:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - Casdoor: http://localhost:8000
   - FreshRSS: http://localhost:8080

## Development

- To run the frontend in development mode:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```

- To run the backend in development mode:
   ```bash
  cd backend
  python -m venv venv
  source venv/bin/activate  # On Windows: venv\Scripts\activate
  pip install -r requirements.txt
  uvicorn app.main:app --reload
  ```

## License

This project is licensed under the MIT License. 