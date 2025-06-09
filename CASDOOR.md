# Casdoor Setup Guide

This guide outlines how to set up Casdoor, create a certificate, organization, application, and obtain the client_id, client_secret, and certificate.

## 1. Bring Up Casdoor

If you're using the provided Docker Compose stack, Casdoor will be started automatically.  
You can access Casdoor at:  
```
http://localhost:8000
```

The default admin credentials are usually:
- **Username:** `admin`
- **Password:** `123`

> If you changed these in your Casdoor config, use your custom credentials.

## 2. Log in to Casdoor

1. Open your browser and go to [http://localhost:8000](http://localhost:8000).
2. Log in with the admin credentials.

## 3. Create a Certificate

1. In the Casdoor admin panel, go to **Certificates** in the sidebar.
2. Click **Add**.
3. Fill in the required fields (e.g., name, display name).
4. For development, you can use the built-in certificate type.
5. Click **Save**.

## 4. Create an Organization

1. Go to **Organizations** in the sidebar.
2. Click **Add**.
3. Fill in the required fields (e.g., name, display name).
4. Click **Save**.

## 5. Create an Application

1. Go to **Applications** in the sidebar.
2. Click **Add**.
3. Fill in the required fields:
   - **Name:** (e.g., `newsfeed`)
   - **Display Name:** (e.g., `NewsFeed App`)
   - **Organization:** Select the organization you created earlier.
   - **Certificate:** Select the certificate you created earlier.
   - **Redirect URIs:** Add the callback URL for your frontend (e.g., `http://localhost:3000/api/auth/callback/casdoor`)
   - **Grant Types:** Enable `authorization_code` and any others you need.
4. Click **Save**.

## 6. Obtain client_id, client_secret, and certificate

- After saving the application, click on it in the list.
- You will see:
  - **Client ID:** (copy this value)
  - **Client Secret:** (copy this value)
  - **Certificate:** (copy the certificate string or file as needed)

## 7. Update Your Environment File

Add these values to your `env` file:
```
CASDOOR_CLIENT_ID=your-client-id
CASDOOR_CLIENT_SECRET=your-client-secret
CASDOOR_CERTIFICATE=your-certificate
CASDOOR_ENDPOINT=http://localhost:8000
``` 