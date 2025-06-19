'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useEnv } from '@/context/AuthContext';
import Script from 'next/script';

// No need to redeclare ENV_CONFIG, it's already in global.d.ts

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnvLoaded, setIsEnvLoaded] = useState(false);
  const requestInProgress = useRef(false);
  const env = useEnv();
  const { refreshUser } = useAuth();

  // Check if environment variables are loaded
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Function to check if ENV_CONFIG is loaded and has values
    const checkEnvConfig = () => {
      if (window.ENV_CONFIG && 
          window.ENV_CONFIG.NEXT_PUBLIC_CASDOOR_SERVER_URL && 
          window.ENV_CONFIG.NEXT_PUBLIC_CASDOOR_CLIENT_ID) {
        setIsEnvLoaded(true);
      }
    };

    // Check immediately
    checkEnvConfig();

    // Also listen for the env-config-loaded event
    const handleEnvLoaded = () => {
      checkEnvConfig();
    };

    window.addEventListener('env-config-loaded', handleEnvLoaded);
    return () => {
      window.removeEventListener('env-config-loaded', handleEnvLoaded);
    };
  }, []);

  // Handle the callback once environment variables are loaded
  useEffect(() => {
    const handleCallback = async () => {
      if (typeof window === 'undefined' || !isEnvLoaded || requestInProgress.current) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      if (!code || !state) {
        setError('Missing code or state parameter');
        setIsLoading(false);
        return;
      }

      try {
        // Set flag to prevent multiple requests
        requestInProgress.current = true;

        // Use either context values or direct window.ENV_CONFIG values
        const clientId = env.CASDOOR_CLIENT_ID || window.ENV_CONFIG?.NEXT_PUBLIC_CASDOOR_CLIENT_ID;
        const redirectUri = env.CASDOOR_REDIRECT_URI || window.ENV_CONFIG?.NEXT_PUBLIC_CASDOOR_REDIRECT_URI;
        const serverUrl = env.CASDOOR_SERVER_URL || window.ENV_CONFIG?.NEXT_PUBLIC_CASDOOR_SERVER_URL;

        if (!clientId || !redirectUri || !serverUrl) {
          throw new Error('Missing required Casdoor configuration');
        }

        console.log('Sending authentication request to backend...');
        
        // Send the code to the backend API for token exchange
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
            redirectUri,
          }),
          credentials: 'include', // Important: needed to receive cookies
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Authentication failed: ${errorText}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(`Casdoor error: ${data.error}`);
        }

        console.log('Authentication successful, storing user data...');
        
        // Store only minimal user data in localStorage
        // The JWT token is now stored in an httpOnly cookie managed by the backend
        if (data.user) {
          localStorage.setItem('casdoorUser', JSON.stringify(data.user));
          
          // Explicitly refresh the authentication state
          await refreshUser();
        }
        
        // Get the redirect path from the state if available
        const redirectPath = urlParams.get('redirect') || '/';
        
        // Redirect after a short delay to ensure data is stored and state is updated
        setTimeout(() => {
          // Force a hard navigation to ensure the app fully reloads with the new auth state
          window.location.href = redirectPath;
        }, 100);
      } catch (error) {
        console.error('Authentication error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        setIsLoading(false);
        // Reset the flag so user can try again
        requestInProgress.current = false;
      }
    };

    if (isEnvLoaded) {
      handleCallback();
    }
  }, [router, env, isEnvLoaded, refreshUser]);

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 max-w-md mx-auto my-8">
        <h2 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">Authentication Error</h2>
        <p className="text-gray-700 dark:text-gray-300">{error}</p>
        <button 
          onClick={() => router.push('/login')} 
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded transition-colors"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="text-center my-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Logging in...</h2>
      <p className="text-gray-600 dark:text-gray-400 mt-2">Please wait while we complete your authentication</p>
    </div>
  );
} 