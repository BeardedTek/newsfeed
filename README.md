# NewsFeed

A modern RSS reader built with Next.js, FreshRSS, Casdoor, and PostgreSQL.

## Features

- Modern UI built with Next.js and Flowbite
- OAuth2 authentication with Casdoor
- RSS feed management with FreshRSS
- User preferences stored in PostgreSQL
- Responsive design for all devices

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- FreshRSS instance
- Casdoor instance

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/newsfeed.git
cd newsfeed
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL="postgresql://user:password@localhost:5432/newsfeed?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
CASDOOR_ENDPOINT="http://localhost:8000"
CASDOOR_CLIENT_ID="your-client-id"
CASDOOR_CLIENT_SECRET="your-client-secret"
CASDOOR_CERTIFICATE="your-certificate"
FRESHRSS_URL="http://localhost:8080"
FRESHRSS_API_KEY="your-api-key"
```

4. Initialize the database:
```bash
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Project Structure

```
src/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions and shared code
├── prisma/          # Database schema and migrations
└── types/           # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 