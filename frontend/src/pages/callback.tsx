import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Log all environment variables for debugging
console.log('Environment variables:', {
  serverUrl: process.env.NEXT_PUBLIC_CASDOOR_SERVER_URL,
  clientId: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_SECRET ? '***' : undefined,
  organizationName: process.env.NEXT_PUBLIC_CASDOOR_ORG_NAME,
  appName: process.env.NEXT_PUBLIC_CASDOOR_APP_NAME,
  redirectPath: process.env.NEXT_PUBLIC_CASDOOR_REDIRECT_URI,
});

const casdoorConfig = {
  serverUrl: process.env.NEXT_PUBLIC_CASDOOR_SERVER_URL!,
  clientId: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID!,
  clientSecret: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_SECRET!,
  redirectPath: process.env.NEXT_PUBLIC_CASDOOR_REDIRECT_URI!,
};

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleCallback = async () => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    if (!code || !state) {
      setError('Missing code or state parameter');
      return;
    }

    try {
      const formData = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID!,
        client_secret: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${window.location.protocol}//${window.location.host}/callback`,
      });

      const tokenResponse = await fetch('/api/auth/casdoor/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token response error:', errorText);
        throw new Error(`Failed to get access token: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        throw new Error(`Casdoor error: ${tokenData.error} - ${tokenData.message || tokenData.content || ''}`);
      }

      const userInfoResponse = await fetch('/api/auth/get-user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userInfo = await userInfoResponse.json();
      const userData = {
        ...userInfo.data,
        jwt: tokenData.access_token,
      };

      sessionStorage.setItem('casdoorUser', JSON.stringify(userData));
      router.push('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  useEffect(() => {
    handleCallback();
  }, [router]);

  if (error) {
    return <div className="text-red-600 p-8">Error: {error}</div>;
  }

  return <div>Logging in...</div>;
} 