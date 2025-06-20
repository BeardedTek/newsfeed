'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/utils/api';

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!searchParams) {
        setError('Invalid verification link.');
        setLoading(false);
        return;
      }
      
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Invalid verification link. No token provided.');
        setLoading(false);
        return;
      }
      
      try {
        const response = await apiPost('/auth/verify-email', { token });
        
        if (response.success) {
          setSuccess(response.message || 'Email verified successfully! You can now sign in.');
        } else {
          setError('Failed to verify email. The link may be expired or invalid.');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Failed to verify email. The link may be expired or invalid.');
      } finally {
        setLoading(false);
      }
    };
    
    verifyEmail();
  }, [searchParams]);

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <Link href="/" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
          <img className="w-8 h-8 mr-2" src="/logo-square.png" alt="logo" />
          NewsFeed
        </Link>
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Email Verification
            </h1>
            
            {loading && (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
                <p className="mt-4 text-gray-700 dark:text-gray-300">Verifying your email...</p>
              </div>
            )}
            
            {error && (
              <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-800/20 dark:text-red-400" role="alert">
                <p className="font-medium mb-2">Verification Failed</p>
                <p>{error}</p>
                <div className="mt-4">
                  <Link href="/signup" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
                    Back to Sign Up
                  </Link>
                </div>
              </div>
            )}
            
            {success && (
              <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-green-800/20 dark:text-green-400" role="alert">
                <p className="font-medium mb-2">Success!</p>
                <p>{success}</p>
                <div className="mt-4">
                  <Link href="/signin" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
                    Go to Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 