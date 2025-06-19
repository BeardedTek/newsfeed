# NewsFeed Backend

This is the backend for the NewsFeed application, built with FastAPI.

## Project Structure

The project follows a modular structure inspired by FastAPI best practices:

```
backend/
├── app/
│   ├── api/                 # API routes
│   │   ├── admin.py
│   │   ├── articles.py
│   │   ├── auth.py
│   │   ├── categories.py
│   │   ├── related.py
│   │   ├── sources.py
│   │   └── thumbnails.py
│   ├── auth/                # Authentication
│   │   ├── casdoor.py       # Legacy Casdoor integration
│   │   └── casdoor_sdk.py   # New Casdoor SDK integration
│   ├── models/              # Data models
│   │   ├── article.py       # Pydantic models
│   │   └── database.py      # SQLAlchemy models
│   ├── services/            # Business logic
│   │   ├── article.py
│   │   ├── auth.py
│   │   ├── category.py
│   │   ├── freshrss.py
│   │   └── related.py
│   ├── config.py            # App configuration
│   ├── database.py          # Database connection
│   ├── init_db.py           # Database initialization
│   ├── logging_config.py    # Logging configuration
│   └── main.py              # FastAPI app initialization
└── requirements.txt         # Dependencies
```

## Architecture

The application follows a layered architecture:

1. **API Layer** (app/api/): Handles HTTP requests and responses
2. **Service Layer** (app/services/): Contains business logic
3. **Data Access Layer** (app/models/): Defines database models and data schemas
4. **Infrastructure Layer** (app/database.py, app/config.py): Handles configuration and connections

## Key Components

- **FastAPI**: Web framework for building APIs
- **SQLAlchemy**: ORM for database access
- **Pydantic**: Data validation and settings management
- **Casdoor**: Authentication provider
- **FreshRSS**: RSS feed aggregator

## Authentication

The application uses Casdoor for authentication. The implementation uses the official Casdoor Python SDK.

### Authentication Flow

1. User is redirected to Casdoor login page
2. After successful login, Casdoor redirects back to the application with an authorization code
3. The application exchanges the code for an access token
4. The access token is used to authenticate API requests

### Required Environment Variables

```
CASDOOR_ENDPOINT=http://casdoor:8000
CASDOOR_CLIENT_ID=your-client-id
CASDOOR_CLIENT_SECRET=your-client-secret
CASDOOR_CERT_PUBLIC_KEY=your-cert-public-key
CASDOOR_ORG_NAME=your-org-name
CASDOOR_APP_NAME=your-app-name
```

## Development

### Running the Application

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
uvicorn app.main:app --reload
```

### API Documentation

When running in debug mode, API documentation is available at:
- Swagger UI: `/api/docs`
- ReDoc: `/api/redoc`

## Best Practices

This project follows several best practices:

1. **Separation of Concerns**: Routes, services, and models are separated
2. **Service Layer**: Business logic is encapsulated in service classes
3. **Dependency Injection**: FastAPI's dependency injection is used for database sessions
4. **Configuration Management**: Settings are managed with Pydantic
5. **Consistent Naming**: Consistent naming conventions throughout the codebase
6. **SQL-First, Pydantic-Second**: Database operations are optimized with SQL
7. **Proper Documentation**: API endpoints are documented with docstrings 