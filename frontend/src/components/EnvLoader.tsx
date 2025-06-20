"use client";
import { useState, useEffect, ReactNode } from 'react';

interface EnvLoaderProps {
  children: ReactNode;
}

export default function EnvLoader({ children }: EnvLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') {
      return;
    }
    
    // Check if window.ENV_CONFIG exists
    if (!window.ENV_CONFIG) {
      console.error('ENV_CONFIG not found in window object');
      setError('Environment configuration not loaded. Please refresh the page.');
      return;
    }
    
    const requiredVars = [
      'NEXT_PUBLIC_CASDOOR_SERVER_URL',
      'NEXT_PUBLIC_CASDOOR_CLIENT_ID',
      'NEXT_PUBLIC_CASDOOR_APP_NAME',
      'NEXT_PUBLIC_CASDOOR_ORG_NAME',
      'NEXT_PUBLIC_CASDOOR_REDIRECT_URI'
    ];
    
    const missingVars = requiredVars.filter(key => !window.ENV_CONFIG[key]);
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      setError(`Missing required environment variables: ${missingVars.join(', ')}`);
      return;
    }
    
    setIsLoaded(true);
  }, []);

  if (error) {
    return <div className="flex items-center justify-center h-screen">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    </div>;
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return <>{children}</>;
} 