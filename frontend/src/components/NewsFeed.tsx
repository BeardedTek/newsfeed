'use client';

import { useEffect, useState, Suspense, useRef, useCallback, useMemo } from 'react';
import { Spinner, Badge, Select, TextInput } from 'flowbite-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { HiSearch } from 'react-icons/hi';
import { useSearchContext } from '@/context/SearchContext';
import NewsCard from './NewsCard';
import { Article } from '@/types/article';

const API_BASE = '/api';

// Add these constants at the top of the file
const BATCH_SIZE = 15; // Number of articles to load per batch
const BATCH_DEBOUNCE_MS = 200; // Debounce delay in milliseconds
const RELATED_BATCH_SIZE = 50; // Increased from 15 to 50

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractThumbnail(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"'>]+)["']/i);
  return match ? match[1] : null;
}

function stripHtmlAndTruncate(html: string, wordLimit: number): string {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, ' ');
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  return words.slice(0, wordLimit).join(' ') + (words.length > wordLimit ? '…' : '');
}

function dedupeArticles(articles: any[]): any[] {
  const seen = new Set();
  return articles.filter(article => {
    const key = `${article.title}|${article.origin?.title || ''}|${article.published}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const arrA = Array.from(setA);
  const arrB = Array.from(setB);
  const intersection = arrA.filter(x => setB.has(x));
  const union = Array.from(new Set([...arrA, ...arrB]));
  return union.length === 0 ? 0 : intersection.length / union.length;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Politics: ['election', 'government', 'senate', 'congress', 'president', 'politics', 'law', 'policy', 'minister', 'parliament'],
  US: ['united states', 'america', 'us ', 'usa', 'american', 'washington', 'new york', 'california'],
  World: ['world', 'global', 'international', 'foreign', 'abroad', 'overseas'],
  Sports: ['sport', 'game', 'match', 'tournament', 'league', 'nba', 'nfl', 'mlb', 'soccer', 'football', 'basketball', 'olympics'],
  Technology: ['tech', 'technology', 'software', 'hardware', 'computer', 'ai', 'artificial intelligence', 'internet', 'app', 'gadget', 'device'],
  Entertainment: ['movie', 'film', 'music', 'entertainment', 'tv', 'show', 'celebrity', 'concert', 'festival'],
  Science: ['science', 'research', 'study', 'scientist', 'space', 'nasa', 'physics', 'chemistry', 'biology'],
  Health: ['health', 'medicine', 'medical', 'doctor', 'hospital', 'disease', 'virus', 'covid', 'wellness'],
  Business: ['business', 'market', 'stock', 'finance', 'economy', 'trade', 'company', 'corporate', 'industry'],
};

function getCategories(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(CATEGORY_KEYWORDS)
    .filter(([cat, keywords]) => keywords.some(kw => lower.includes(kw)))
    .map(([cat]) => cat);
}

function normalizeArticle(article: any): Article {
  return {
    ...article,
    summary: typeof article.summary === 'string' 
      ? { content: article.summary } 
      : article.summary || { content: '' },
    origin: typeof article.origin === 'string' 
      ? { title: article.origin } 
      : article.origin || { title: '' },
    related: article.related || [],
    categories: article.categories || [],
    url: article.url || '',
  };
}

interface NewsFeedProps {
  initialCategory?: string;
  searchQuery?: string | null;
  selectedSource?: string;
  onSourceChange?: (source: string) => void;
  onSourcesUpdate?: (sources: string[]) => void;
  initialArticles?: Article[];
}

const CATEGORIES = [
  'Politics', 'US', 'World', 'Sports', 'Technology', 'Entertainment', 'Science', 'Health', 'Business'
];

function NewsFeedContent({ initialCategory, searchQuery, selectedSource: parentSelectedSource, onSourceChange, onSourcesUpdate, initialArticles }: NewsFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams?.get('category') || initialCategory;
  const query = searchParams?.get('q') || searchQuery;
  const [articles, setArticles] = useState<Article[]>(initialArticles ? initialArticles.map(normalizeArticle) : []);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>(parentSelectedSource || 'all');
  const [allSources, setAllSources] = useState<{ id: string; title: string }[]>([]);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { showSearch, setShowSearch } = useSearchContext();

  const loadMoreArticles = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    try {
      const skip = visibleCount;
      const queryParams = new URLSearchParams();
      if (category) queryParams.append('category', category);
      if (selectedSource !== 'all') queryParams.append('source', selectedSource);
      if (query) queryParams.append('search', query);
      queryParams.append('skip', skip.toString());
      queryParams.append('limit', BATCH_SIZE.toString());

      const response = await fetch(`${API_BASE}/articles?${queryParams.toString()}`);
      const data = await response.json();
      
      const newArticles = data.articles || [];
      if (newArticles.length === 0) {
        setHasMore(false);
      } else {
        const normalizedNewArticles = newArticles.map(normalizeArticle);
        setArticles(prev => [...prev, ...normalizedNewArticles]);
        setVisibleCount(prev => prev + BATCH_SIZE);
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, hasMore, visibleCount, category, selectedSource, query]);

  // Reset to initial batch if category, source, or search changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
    setHasMore(true);
  }, [category, selectedSource, query]);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isFetchingMore && !loading) {
          loadMoreArticles();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, isFetchingMore, loading, category, selectedSource, query, loadMoreArticles]);

  // Initial articles fetch
  useEffect(() => {
    setLoading(true);
    setVisibleCount(BATCH_SIZE);
    setSelectedSource('all');
    setHasMore(true);

    const fetchInitialArticles = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (query) queryParams.append('search', query);
        queryParams.append('limit', BATCH_SIZE.toString());

        const response = await fetch(`${API_BASE}/articles?${queryParams.toString()}`);
        const data = await response.json();
        
          let items = (data.articles || []).sort((a: Article, b: Article) => {
            return (b.published || 0) - (a.published || 0);
          });
          items = dedupeArticles(items).map(normalizeArticle);
          setArticles(items);
        setHasMore(items.length === BATCH_SIZE);
          if (onSourceChange) onSourceChange('all');
      } catch (error) {
        console.error('Error fetching initial articles:', error);
      } finally {
          setLoading(false);
      }
    };

    fetchInitialArticles();
  }, [query, onSourceChange]);

  useEffect(() => {
    if (parentSelectedSource && parentSelectedSource !== selectedSource) {
      setSelectedSource(parentSelectedSource);
    }
  }, [parentSelectedSource]);

  // Filter articles by category and source
  const filteredArticles = articles.filter(article => {
    const articleCats = article.categories || getCategories(article.title + ' ' + (article.summary?.content || ''));
    const matchesCategory = !category || articleCats.some(cat => cat.toLowerCase() === category);
    const matchesSource = selectedSource === 'all' || article.origin?.title === selectedSource;
    return matchesCategory && matchesSource;
  });

  // Infinite scroll: show only up to visibleCount
  const visibleArticles = filteredArticles.slice(0, visibleCount);

  const handleSourceClick = (source: string) => {
    setSelectedSource(source);
    // Update URL to reflect the source filter
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('source', source);
    router.push(`/?${params.toString()}`);
  };

  useEffect(() => {
    setShowSearch(!!searchParams?.has('q'));
  }, [searchParams, setShowSearch]);
      
  // Fetch sources from /api/sources/ on mount
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await fetch('/api/sources/');
        const data = await res.json();
        if (data.sources) {
          setAllSources(data.sources);
        }
      } catch (error) {
        console.error('Error fetching sources:', error);
      }
    };
    fetchSources();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;

  return (
    <div className="dark:bg-gray-900 max-w-6xl mx-auto mt-0">
      {/* Top latest news row */}
      <div className="flex flex-col mb-6 w-full sticky top-16 z-40 bg-gray-50 dark:bg-gray-900">
        {/* Search and filters in one row */}
        <div className="flex flex-col md:flex-row justify-between items-center px-4 gap-4 py-2">
          {/* Search bar area - always takes up space even when hidden */}
          <div className="w-full md:flex-1 md:mr-4">
            {showSearch && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = form.querySelector('input') as HTMLInputElement;
                if (input.value.trim()) {
                  router.push(`/?q=${encodeURIComponent(input.value.trim())}`);
                }
              }} className="w-full">
                <TextInput
                  type="search"
                  placeholder="Search articles..."
                  defaultValue={query ?? ''}
                  icon={HiSearch}
                  className="w-full"
                />
              </form>
            )}
          </div>
          
          {/* Dropdowns - stacked in mobile, side by side in desktop */}
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center w-full md:w-auto shrink-0">
            <Select
              value={selectedSource}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setSelectedSource(e.target.value);
                // Update URL to reflect the source filter
                const params = new URLSearchParams(searchParams?.toString() || '');
                params.set('source', e.target.value);
                router.push(`/?${params.toString()}`);
              }}
              className="w-full md:w-48 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
            >
              <option value="all" className="bg-white dark:bg-gray-800 dark:text-gray-200">All Sources</option>
              {allSources.map(source => (
                <option key={source.id} value={source.title} className="bg-white dark:bg-gray-800 dark:text-gray-200">{source.title}</option>
              ))}
            </Select>
            <Select
              value={category || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                // Update URL to reflect the category filter
                const params = new URLSearchParams(searchParams?.toString() || '');
                if (e.target.value) {
                  params.set('category', e.target.value);
                } else {
                  params.delete('category');
                }
                router.push(`/?${params.toString()}`);
              }}
              className="w-full md:w-48 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
            >
              <option value="" className="bg-white dark:bg-gray-800 dark:text-gray-200">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat.toLowerCase()} className="bg-white dark:bg-gray-800 dark:text-gray-200">{cat}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleArticles.map((article) => {
          const summary = stripHtmlAndTruncate(article.summary?.content || '', 50);
          // Use thumbnail_url or fallback to default image
          const imageSrc = article.thumbnail_url
            ? article.thumbnail_url
            : '/favicon.svg';
          return (
            <NewsCard
              key={article.id}
              article={article}
              summary={summary}
              thumbnail={imageSrc}
              related={article.related || []}
              categories={article.categories || []}
              onSourceClick={handleSourceClick}
            />
          );
        })}
      </div>
      {/* Loader for infinite scroll */}
      <div ref={loaderRef} className="flex justify-center items-center h-16">
        {isFetchingMore && <Spinner />}
        {!hasMore && articles.length > 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No more articles to load</p>
        )}
      </div>
    </div>
  );
}

export default function NewsFeed(props: NewsFeedProps) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner /></div>}>
      <NewsFeedContent {...props} />
    </Suspense>
  );
} 