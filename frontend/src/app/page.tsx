'use client';

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsFeed from '@/components/NewsFeed';

function HomeContent() {
  const searchParams = useSearchParams();
  const category = searchParams?.get('category');
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NewsFeed
        initialCategory={category || undefined}
        searchQuery={searchQuery}
      />
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