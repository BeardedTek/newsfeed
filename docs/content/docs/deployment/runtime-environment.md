---
weight: 45
title: "Frontend Environment Variables"
---

# Frontend Environment Variables

NewsFeed's frontend application is designed to use environment variables at runtime rather than build time. This approach provides greater flexibility when deploying the same container image to different environments.

## How It Works

The runtime environment configuration system consists of several components:

1. **Environment Variable Template**: A JavaScript file with placeholders
2. **Replacement Script**: A Node.js script that replaces placeholders with actual values
3. **Startup Script**: A shell script that runs the replacement script before starting the application
4. **Browser Integration**: Code that loads the environment configuration in the browser

This approach allows you to change environment variables without rebuilding the Docker image.

## Implementation Details

### Environment Variable Template

The template file (`/public/env-config.js`) contains placeholders for environment variables:

```javascript
// This file will be replaced at runtime with environment variables
window.ENV_CONFIG = {
  NEXT_PUBLIC_CASDOOR_SERVER_URL: "__NEXT_PUBLIC_CASDOOR_SERVER_URL__",
  NEXT_PUBLIC_CASDOOR_CLIENT_ID: "__NEXT_PUBLIC_CASDOOR_CLIENT_ID__",
  // ... other variables
};
```

### Replacement Script

The Node.js script (`/scripts/generate-env-config.js`) replaces placeholders with actual environment variable values:

```javascript
#!/usr/bin/env node

// Script to replace environment variable placeholders in env-config.js
const fs = require('fs');
const path = require('path');

// Path to the env-config.js file
const envConfigPath = path.join(process.cwd(), 'public', 'env-config.js');

// Read the template file
let content = fs.readFileSync(envConfigPath, 'utf8');

// Define variable mappings (with and without NEXT_PUBLIC_ prefix)
const envVarMappings = [
  ['NEXT_PUBLIC_CASDOOR_SERVER_URL', 'CASDOOR_SERVER_URL'],
  // ... other mappings
];

// Replace each placeholder with its actual environment variable value
envVarMappings.forEach(([nextPublicVar, plainVar]) => {
  const placeholder = `__${nextPublicVar}__`;
  
  // First try with NEXT_PUBLIC_ prefix, then without
  const value = process.env[nextPublicVar] || process.env[plainVar] || '';
  
  content = content.replace(placeholder, value);
});

// Write the updated content back to the file
fs.writeFileSync(envConfigPath, content, 'utf8');
```

### Startup Script

The shell script (`/scripts/start.sh`) runs the replacement script before starting the application:

```bash
#!/bin/sh

# Map non-prefixed environment variables to ones with NEXT_PUBLIC_ prefix
if [ -n "$CASDOOR_SERVER_URL" ]; then
  export NEXT_PUBLIC_CASDOOR_SERVER_URL=$CASDOOR_SERVER_URL
fi
# ... other mappings

# Generate the runtime environment configuration
node /app/scripts/generate-env-config.js

# Start the Next.js server
exec node server.js
```

### Browser Integration

The application loads the environment configuration in the browser:

```tsx
// In layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Load runtime environment configuration before any other scripts */}
        <Script src="/env-config.js" strategy="beforeInteractive" />
        {/* ... other head content */}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Accessing Environment Variables

The application code accesses environment variables through a helper function:

```tsx
// Helper function to get environment variables at runtime
const getEnvVar = (key: string): string => {
  if (typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG[key]) {
    return window.ENV_CONFIG[key];
  }
  // Fallback to process.env during development or SSR
  return process.env[key] || '';
};

// Usage example
const serverUrl = getEnvVar('NEXT_PUBLIC_CASDOOR_SERVER_URL');
```

## Simplified Environment Variable Names

For convenience, you can use environment variable names without the `NEXT_PUBLIC_` prefix in your configuration files. The startup script automatically maps them to the prefixed versions required by Next.js.

For example, in your `env/frontend` file or Docker Compose configuration:

```
# Instead of:
NEXT_PUBLIC_CASDOOR_SERVER_URL=http://localhost:8000

# You can use:
CASDOOR_SERVER_URL=http://localhost:8000
```

## Benefits

This approach provides several benefits:

1. **Deployment Flexibility**: Deploy the same image to different environments
2. **Simplified Configuration**: Use cleaner environment variable names
3. **No Rebuilds**: Change configuration without rebuilding the image
4. **Consistent Development**: Use the same environment variable system in all environments

## Supported Environment Variables

The following environment variables are supported by the runtime configuration system:

| Variable Name (without prefix) | Description |
|-------------------------------|-------------|
| `CASDOOR_SERVER_URL` | URL of the Casdoor authentication server |
| `CASDOOR_CLIENT_ID` | Client ID for Casdoor authentication |
| `CASDOOR_CLIENT_SECRET` | Client secret for Casdoor authentication |
| `CASDOOR_APP_NAME` | Application name in Casdoor |
| `CASDOOR_ORG_NAME` | Organization name in Casdoor |
| `CASDOOR_REDIRECT_URI` | Redirect URI for authentication callbacks |
| `CONTACT_FORM_ACTION` | Action URL for the contact form | 