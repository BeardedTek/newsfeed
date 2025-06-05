# NewsFeed

A modern news aggregation platform built with Next.js, FreshRSS, and Redis.

## Features

- Real-time news aggregation from multiple sources
- Category-based filtering
- Source-based filtering
- User authentication with Casdoor
- User preferences and profiles
- Responsive design with Flowbite UI
- Redis caching for improved performance

## Prerequisites

- Node.js 20 or later
- Docker and Docker Compose
- Redis server
- FreshRSS instance with API access
- Casdoor instance for authentication

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/newsfeed"

# Redis
REDIS_URL="redis://localhost:6379"

# FreshRSS
FRESHRSS_URL="https://your-freshrss-instance.com"
FRESHRSS_API_USER="your-api-user"
FRESHRSS_API_PASSWORD="your-api-password"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Casdoor
CASDOOR_URL="https://your-casdoor-instance.com"
CASDOOR_CLIENT_ID="your-client-id"
CASDOOR_CLIENT_SECRET="your-client-secret"
CASDOOR_CERTIFICATE="your-certificate"
```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t newsfeed .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="postgresql://user:password@host:5432/newsfeed" \
     -e REDIS_URL="redis://host:6379" \
     -e FRESHRSS_URL="https://your-freshrss-instance.com" \
     -e FRESHRSS_API_USER="your-api-user" \
     -e FRESHRSS_API_PASSWORD="your-api-password" \
     -e NEXTAUTH_URL="http://localhost:3000" \
     -e NEXTAUTH_SECRET="your-nextauth-secret" \
     -e CASDOOR_URL="https://your-casdoor-instance.com" \
     -e CASDOOR_CLIENT_ID="your-client-id" \
     -e CASDOOR_CLIENT_SECRET="your-client-secret" \
     -e CASDOOR_CERTIFICATE="your-certificate" \
     newsfeed
   ```

## Docker Compose Setup

1. Create a `docker-compose.yml` file:
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://user:password@db:5432/newsfeed
         - REDIS_URL=redis://redis:6379
         - FRESHRSS_URL=https://your-freshrss-instance.com
         - FRESHRSS_API_USER=your-api-user
         - FRESHRSS_API_PASSWORD=your-api-password
         - NEXTAUTH_URL=http://localhost:3000
         - NEXTAUTH_SECRET=your-nextauth-secret
         - CASDOOR_URL=https://your-casdoor-instance.com
         - CASDOOR_CLIENT_ID=your-client-id
         - CASDOOR_CLIENT_SECRET=your-client-secret
         - CASDOOR_CERTIFICATE=your-certificate
       depends_on:
         - db
         - redis

     db:
       image: postgres:15
       environment:
         - POSTGRES_USER=user
         - POSTGRES_PASSWORD=password
         - POSTGRES_DB=newsfeed
       volumes:
         - postgres_data:/var/lib/postgresql/data

     redis:
       image: redis:7
       volumes:
         - redis_data:/data

   volumes:
     postgres_data:
     redis_data:
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

## API Endpoints

- `GET /api/news` - Get latest news articles
- `POST /api/categorize` - Categorize article text
- `GET /api/preferences` - Get user preferences
- `POST /api/preferences` - Update user preferences
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Update user profile

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 