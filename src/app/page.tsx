'use client';

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsFeed from '@/components/NewsFeed';
import Navbar from '@/components/navbar/Navbar';

function HomeContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar onSearch={handleSearch} />
      <NewsFeed initialCategory={category || undefined} searchQuery={searchQuery} />
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