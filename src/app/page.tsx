'use client';

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsFeed from '@/components/NewsFeed';
import Navbar from '@/components/navbar/Navbar';

function HomeContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState('all');
  const [allSources, setAllSources] = useState<string[]>([]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSourceChange = useCallback((source: string) => {
    setSelectedSource(source);
  }, []);

  const handleSourcesUpdate = useCallback((sources: string[]) => {
    setAllSources(sources);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar
        onSearch={handleSearch}
        allSources={allSources}
        selectedSource={selectedSource}
        onSourceChange={handleSourceChange}
      />
      <NewsFeed
        initialCategory={category || undefined}
        searchQuery={searchQuery}
        allSources={allSources}
        selectedSource={selectedSource}
        onSourceChange={handleSourceChange}
        onSourcesUpdate={handleSourcesUpdate}
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