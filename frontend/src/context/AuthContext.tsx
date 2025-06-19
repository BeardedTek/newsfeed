"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Helper function to get environment variables at runtime
export const getEnvVar = (key: string): string => {
  if (typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG[key]) {
    return window.ENV_CONFIG[key];
  }
  // Fallback to process.env during development or SSR
  return process.env[key] || '';
};

// Custom hook for accessing environment variables
export const useEnv = () => {
  const [env, setEnv] = useState({
    CASDOOR_SERVER_URL: '',
    CASDOOR_CLIENT_ID: '',
    CASDOOR_ORG_NAME: '',
    CASDOOR_APP_NAME: '',
    CASDOOR_REDIRECT_URI: '',
  });

  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return;
    
    // Function to update env from window.ENV_CONFIG
    const updateEnv = () => {
      if (window.ENV_CONFIG) {
        setEnv({
          CASDOOR_SERVER_URL: window.ENV_CONFIG.NEXT_PUBLIC_CASDOOR_SERVER_URL || '',
          CASDOOR_CLIENT_ID: window.ENV_CONFIG.NEXT_PUBLIC_CASDOOR_CLIENT_ID || '',
          CASDOOR_ORG_NAME: window.ENV_CONFIG.NEXT_PUBLIC_CASDOOR_ORG_NAME || '',
          CASDOOR_APP_NAME: window.ENV_CONFIG.NEXT_PUBLIC_CASDOOR_APP_NAME || '',
          CASDOOR_REDIRECT_URI: window.ENV_CONFIG.NEXT_PUBLIC_CASDOOR_REDIRECT_URI || '',
        });
      } else if (process.env.NODE_ENV === 'development') {
        console.error('ENV_CONFIG not found in window object');
      }
    };
    
    // Update env immediately if ENV_CONFIG is already loaded
    updateEnv();
    
    // Listen for the env-config-loaded event
    const handleEnvConfigLoaded = () => {
      updateEnv();
    };
    
    window.addEventListener('env-config-loaded', handleEnvConfigLoaded);
    
    return () => {
      window.removeEventListener('env-config-loaded', handleEnvConfigLoaded);
    };
  }, []);

  return env;
};

// Simplified User interface with only essential fields
interface User {
  id: string;
  name: string;
  displayName: string;
  avatar: string;
  email: string;
  isAdmin: boolean;
  phone?: string;
  address?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refreshUser: async () => {},
});

// Helper to preserve theme during hydration
const preserveTheme = () => {
  if (typeof window === 'undefined') return;
  
  // Check if dark mode is enabled in localStorage
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  
  // Apply the appropriate class to the html element
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);
  const router = useRouter();

  // Preserve theme before any state changes
  useEffect(() => {
    preserveTheme();
  }, []);

  // Function to refresh user data and token
  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include', // Important: needed to send cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      if (data.user) {
        // Store minimal user data in localStorage
        localStorage.setItem('casdoorUser', JSON.stringify(data.user));
        setUser(data.user);
        
        // Set token expiry for refresh scheduling
        if (data.tokenExpiry) {
          setTokenExpiry(data.tokenExpiry * 1000); // Convert to milliseconds
          localStorage.setItem('tokenExpiry', data.tokenExpiry.toString());
        }
        return data.user;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, clear user data
      localStorage.removeItem('casdoorUser');
      localStorage.removeItem('tokenExpiry');
      setUser(null);
      setTokenExpiry(null);
    }
  };

  // Set up token refresh mechanism
  useEffect(() => {
    if (!tokenExpiry) return;
    
    const now = Date.now();
    const timeUntilRefresh = Math.max(0, tokenExpiry - now - 60000); // Refresh 1 minute before expiry
    
    const refreshTimer = setTimeout(() => {
      refreshUser();
    }, timeUntilRefresh);
    
    return () => clearTimeout(refreshTimer);
  }, [tokenExpiry]);

  // Load user on initial mount
  useEffect(() => {
    // Try to get user from localStorage
    const userInfo = localStorage.getItem('casdoorUser');
    const storedExpiry = localStorage.getItem('tokenExpiry');
    
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
        
        // Set token expiry if available
        if (storedExpiry) {
          const expiryTime = parseFloat(storedExpiry) * 1000; // Convert to milliseconds
          setTokenExpiry(expiryTime);
        }
        
        // Verify the session is still valid with the backend
        refreshUser().catch(console.error);
      } catch (error) {
        localStorage.removeItem('casdoorUser');
        localStorage.removeItem('tokenExpiry');
      }
    }
    
    // Short timeout to prevent flash
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const logout = async () => {
    try {
      // Call backend to clear the auth cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local storage regardless of API success
      localStorage.removeItem('casdoorUser');
      localStorage.removeItem('tokenExpiry');
      setUser(null);
      setTokenExpiry(null);
      router.push('/');
    }
  };

  // If loading, return a div with the same bg color as the main content
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hidden loading indicator */}
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 