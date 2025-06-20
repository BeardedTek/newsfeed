'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

export default function SignInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnverifiedEmail(null);

    try {
      const response = await apiPost('/auth/custom-signin', {
        username,
        password
      });

      // If successful, refresh user data and redirect to home
      await refreshUser();
      router.push('/');
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      // Check if it's an unverified email error
      if (err.message?.includes('403')) {
        try {
          const errorResponse = await err.response?.json();
          if (errorResponse?.error === 'Email not verified' && errorResponse?.email) {
            setUnverifiedEmail(errorResponse.email);
          } else {
            setError('Invalid username or password');
          }
        } catch (parseErr) {
          setError('Invalid username or password');
        }
      } else {
        setError('Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    
    setLoading(true);
    try {
      await apiPost('/auth/resend-verification', { email: unverifiedEmail });
      setError(null);
      setUnverifiedEmail(null);
      alert('Verification email sent. Please check your inbox.');
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCasdoorSignupUrl = () => {
    if (typeof window !== 'undefined' && window.ENV_CONFIG) {
      const serverUrl = window.ENV_CONFIG.NEXT_PUBLIC_CASDOOR_SERVER_URL;
      const appName = window.ENV_CONFIG.NEXT_PUBLIC_CASDOOR_APP_NAME;
      return `${serverUrl}/signup/${appName}`;
    }
    return '/signup';
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900 max-w-screen-md mx-auto">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Sign in to your account
            </h1>
            
            {error && (
              <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-800/20 dark:text-red-400" role="alert">
                {error}
              </div>
            )}
            
            {unverifiedEmail && (
              <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-800/20 dark:text-yellow-300" role="alert">
                <p className="mb-2">Your email address is not verified.</p>
                <button 
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Resend verification email
                </button>
              </div>
            )}
            
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</label>
                <input 
                  type="text" 
                  name="username" 
                  id="username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                  placeholder="username" 
                  required 
                  autoComplete="username"
                />
              </div>
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                  required 
                  autoComplete="current-password"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Signing in...
                  </div>
                ) : 'Sign in'}
              </button>
              <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                Don't have an account yet? <a href={getCasdoorSignupUrl()} className="font-medium text-blue-600 hover:underline dark:text-blue-500">Sign up</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
} 