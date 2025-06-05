'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsFeed from '@/components/NewsFeed';

function HomeContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  return (
    <main className="min-h-screen bg-gray-50">
      <NewsFeed initialCategory={category || undefined} />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
} 