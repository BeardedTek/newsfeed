#!/bin/sh

echo "Starting frontend container..."

# Map non-prefixed environment variables to ones with NEXT_PUBLIC_ prefix
if [ -n "$CASDOOR_SERVER_URL" ]; then
  export NEXT_PUBLIC_CASDOOR_SERVER_URL=$CASDOOR_SERVER_URL
fi

if [ -n "$CASDOOR_CLIENT_ID" ]; then
  export NEXT_PUBLIC_CASDOOR_CLIENT_ID=$CASDOOR_CLIENT_ID
fi

if [ -n "$CASDOOR_APP_NAME" ]; then
  export NEXT_PUBLIC_CASDOOR_APP_NAME=$CASDOOR_APP_NAME
fi

if [ -n "$CASDOOR_ORG_NAME" ]; then
  export NEXT_PUBLIC_CASDOOR_ORG_NAME=$CASDOOR_ORG_NAME
fi

if [ -n "$CASDOOR_REDIRECT_URI" ]; then
  export NEXT_PUBLIC_CASDOOR_REDIRECT_URI=$CASDOOR_REDIRECT_URI
fi

if [ -n "$CONTACT_FORM_ACTION" ]; then
  export NEXT_PUBLIC_CONTACT_FORM_ACTION=$CONTACT_FORM_ACTION
fi

# Fix the CASDOOR_REDIRECT_URI if it's empty
if [ -z "$NEXT_PUBLIC_CASDOOR_REDIRECT_URI" ]; then
  export NEXT_PUBLIC_CASDOOR_REDIRECT_URI="http://localhost:8880/callback"
  echo "WARNING: CASDOOR_REDIRECT_URI was empty, setting default: $NEXT_PUBLIC_CASDOOR_REDIRECT_URI"
fi

# Generate the runtime environment configuration
echo "Generating runtime environment configuration..."
node /app/scripts/generate-env-config.js

# Start the Next.js server
echo "Starting Next.js server..."
exec node server.js 