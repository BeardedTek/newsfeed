'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import Script from 'next/script';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileContainer = useRef<HTMLDivElement>(null);

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Initialize Turnstile when component mounts
  useEffect(() => {
    // Check if Turnstile is enabled
    const isTurnstileEnabled = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_ENABLE !== 'false';
    
    // If Turnstile is disabled, skip initialization
    if (!isTurnstileEnabled) {
      return;
    }
    
    // This function will be called when Turnstile is ready
    const renderTurnstile = () => {
      if (!window.turnstile || !turnstileContainer.current) return;
      
      // Reset if we already have a widget
      if (turnstileWidgetId.current) {
        window.turnstile.reset(turnstileWidgetId.current);
      }

      // Render the Turnstile widget
      turnstileWidgetId.current = window.turnstile.render(turnstileContainer.current, {
        sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || '',
        callback: (token: string) => {
          setTurnstileToken(token);
        },
        'expired-callback': () => {
          setTurnstileToken('');
        },
        'error-callback': () => {
          setError('CAPTCHA verification failed. Please try again.');
        },
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      });
    };

    // If Turnstile is already loaded, render it
    if (window.turnstile) {
      renderTurnstile();
    } else {
      // Otherwise wait for it to load
      window.onloadTurnstileCallback = renderTurnstile;
    }

    // Cleanup function
    return () => {
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetId.current);
      }
    };
  }, []);

  // Update Turnstile theme when dark mode changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class' &&
          window.turnstile &&
          turnstileWidgetId.current
        ) {
          window.turnstile.remove(turnstileWidgetId.current);
          turnstileWidgetId.current = null;
          
          // Re-render the widget with the new theme
          if (turnstileContainer.current) {
            turnstileWidgetId.current = window.turnstile.render(turnstileContainer.current, {
              sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || '',
              callback: (token: string) => {
                setTurnstileToken(token);
              },
              'expired-callback': () => {
                setTurnstileToken('');
              },
              'error-callback': () => {
                setError('CAPTCHA verification failed. Please try again.');
              },
              theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            });
          }
        }
      });
    });

    // Start observing the document for class changes
    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate form
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Check if Turnstile is enabled
    const isTurnstileEnabled = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_ENABLE !== 'false';
    
    // Only require token if Turnstile is enabled
    if (isTurnstileEnabled && !turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      setLoading(false);
      return;
    }

    try {
      const response = await apiPost('/auth/custom-signup', {
        username,
        password,
        displayName,
        email,
        turnstileToken
      });

      if (response.success) {
        setSuccess('Account created successfully! Please check your email to verify your account.');
        // Clear the form
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        setEmail('');
        
        // Reset Turnstile
        if (window.turnstile && turnstileWidgetId.current) {
          window.turnstile.reset(turnstileWidgetId.current);
        }
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      try {
        const errorResponse = await err.response?.json();
        setError(errorResponse?.error || 'Failed to create account. Please try again.');
      } catch (parseErr) {
        setError('Failed to create account. Please try again.');
      }
      
      // Reset Turnstile on error
      if (window.turnstile && turnstileWidgetId.current) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Load Cloudflare Turnstile script only if enabled */}
      {process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_ENABLE !== 'false' && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback"
          async
          defer
        />
      )}
      
      <section className="bg-gray-50 dark:bg-gray-900 max-w-screen-md mx-auto">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:min-h-screen lg:py-0">
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                Create an account
              </h1>
              
              {error && (
                <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-800/20 dark:text-red-400" role="alert">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-green-800/20 dark:text-green-400" role="alert">
                  {success}
                  <div className="mt-2">
                    <Link href="/signin" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
                      Go to Sign In
                    </Link>
                  </div>
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
                  />
                </div>
                <div>
                  <label htmlFor="displayName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Display Name</label>
                  <input 
                    type="text" 
                    name="displayName" 
                    id="displayName" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                    placeholder="John Doe" 
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                    placeholder="name@example.com" 
                    required 
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
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    id="confirmPassword" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                    required 
                  />
                </div>
                
                {/* Cloudflare Turnstile - only show if enabled */}
                {process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_ENABLE !== 'false' && (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">CAPTCHA Verification</label>
                    <div ref={turnstileContainer} className="flex justify-center"></div>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={loading || (process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_ENABLE !== 'false' && !turnstileToken)}
                  className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Creating account...
                    </div>
                  ) : 'Create Account'}
                </button>
                <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                  Already have an account? <Link href="/signin" className="font-medium text-blue-600 hover:underline dark:text-blue-500">Sign in</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
} 