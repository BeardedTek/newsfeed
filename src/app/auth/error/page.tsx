'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Error</h1>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">
          {error === 'AccessDenied' && 'You do not have permission to access this resource.'}
          {error === 'Configuration' && 'There is a problem with the server configuration.'}
          {error === 'Verification' && 'The verification token has expired or has already been used.'}
          {!error && 'An error occurred during authentication.'}
        </p>
      </div>
      <div className="mt-6">
        <a
          href="/"
          className="text-blue-600 hover:underline"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
} 