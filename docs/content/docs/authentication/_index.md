---
weight: 50
title: "Authentication"
bookCollapseSection: true
---

# Authentication

This section provides detailed information about the authentication system in NewsFeed.

## Overview

NewsFeed uses [Casdoor](https://casdoor.org/) for authentication and user management. Casdoor is an open-source Identity and Access Management (IAM) solution that provides:

- User authentication
- Single Sign-On (SSO)
- OAuth 2.0 support
- User management
- Role-based access control

## Authentication Flow

The authentication flow in NewsFeed works as follows:

1. User clicks "Login" in the NewsFeed interface
2. User is redirected to the Casdoor login page
3. After successful authentication, Casdoor redirects back to NewsFeed with an authorization code
4. NewsFeed exchanges the code for an access token
5. The access token is stored in the browser and used for subsequent API requests

## Backend Authentication

The backend authenticates API requests using:

1. JWT token validation
2. Public key verification
3. Role-based access control

### JWT Verification

The backend verifies JWT tokens by:

1. Extracting the token from the Authorization header
2. Verifying the token signature using Casdoor's public key
3. Validating token claims (expiration, issuer, etc.)
4. Extracting user information from the token

## Configuration

### Casdoor Configuration

Casdoor is configured through environment variables:

```
# Casdoor Configuration
CASDOOR_ENDPOINT=http://casdoor:8000
CASDOOR_CLIENT_ID=your-client-id
CASDOOR_CLIENT_SECRET=your-client-secret
CASDOOR_ORG=newsfeed
CASDOOR_APP_NAME=newsfeed
CASDOOR_CERT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----"
```

### Frontend Configuration

The frontend is configured through environment variables:

```
# Casdoor configuration
NEXT_PUBLIC_CASDOOR_SERVER_URL=http://localhost:8000
NEXT_PUBLIC_CASDOOR_CLIENT_ID=your-client-id
NEXT_PUBLIC_CASDOOR_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_CASDOOR_APP_NAME=newsfeed
NEXT_PUBLIC_CASDOOR_ORG_NAME=newsfeed
NEXT_PUBLIC_CASDOOR_REDIRECT_URI=http://localhost:8880/callback
```

## User Roles

NewsFeed supports the following user roles:

1. **Anonymous** - Unauthenticated users with limited access
2. **User** - Standard authenticated users
3. **Admin** - Users with administrative privileges

### Role-Based Access

Different API endpoints have different access requirements:

- Public endpoints (no authentication required)
- User endpoints (authentication required)
- Admin endpoints (admin role required)

## Custom Authentication

If you need to use a different authentication system:

1. Modify the `auth.py` file in the backend
2. Update the `AuthContext.tsx` file in the frontend
3. Configure your authentication provider
4. Update the authentication flow

## Troubleshooting

Common authentication issues:

### Invalid Token

**Symptoms:** API requests fail with 401 Unauthorized

**Solutions:**
- Check that the token is being sent correctly
- Verify token expiration
- Ensure the public key is configured correctly

### CORS Issues

**Symptoms:** Authentication fails due to CORS errors

**Solutions:**
- Configure CORS settings in the backend
- Ensure the redirect URI is configured correctly
- Check browser console for specific CORS errors

### Casdoor Connection Issues

**Symptoms:** Unable to connect to Casdoor

**Solutions:**
- Verify Casdoor is running
- Check network connectivity between services
- Validate Casdoor configuration 