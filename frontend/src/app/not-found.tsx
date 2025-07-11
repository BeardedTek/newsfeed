'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function NotFoundContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Page Not Found</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <p className="dark:text-gray-300">The page you are looking for does not exist.</p>
    </div>
  );
}

export default function NotFoundPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
} 