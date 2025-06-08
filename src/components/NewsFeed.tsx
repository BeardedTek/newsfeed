'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { Spinner, Badge, Select } from 'flowbite-react';
import { useSearchParams, useRouter } from 'next/navigation';

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

function NewsCard({ article, summary, thumbnail, related, categories, onSourceClick }: { 
  article: Article, 
  summary: string, 
  thumbnail: string | null, 
  related: Article[], 
  categories: string[],
  onSourceClick: (source: string) => void 
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md p-3 max-w-2xl mb-4 flex flex-col h-full">
      <div>
        <div className="flex flex-row items-start gap-4">
          {thumbnail && (
            <img
              src={thumbnail}
              alt="thumbnail"
              className="w-24 h-24 object-cover rounded flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {article.origin && (
                <button
                  onClick={() => onSourceClick(article.origin!.title)}
                  className="hover:opacity-80 transition-opacity"
                >
                  <Badge color="info">{article.origin.title}</Badge>
                </button>
              )}
              <span className="text-xs text-gray-500 ml-auto">{formatDate(article.published * 1000)}</span>
            </div>
            <a href={article.alternate?.[0]?.href || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">
              <h2 className="text-lg font-semibold mb-1">{article.title}</h2>
            </a>
          </div>
        </div>
        <p className="text-gray-700 text-sm mt-2">{summary}</p>
        {related.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-semibold text-gray-500 mb-1">Related articles:</div>
            <div className="flex flex-col gap-1">
              {related.map((rel) => (
                <a
                  key={rel.id}
                  href={rel.alternate?.[0]?.href || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-black hover:underline"
                >
                  {rel.origin?.title ? `${rel.origin.title}: ` : ''}{rel.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      {categories.length > 0 && (
        <div className="flex flex-row flex-wrap gap-2 justify-end mt-auto pt-3">
          {categories.map(cat => (
            <a
              key={cat}
              href={`/?category=${cat.toLowerCase()}`}
              className="px-2 py-0.5 rounded bg-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-300"
            >
              {cat}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

interface Article {
  id: string;
  title: string;
  summary?: {
    content: string;
  };
  published: number;
  origin?: {
    title: string;
  };
  alternate?: Array<{
    href: string;
  }>;
}

interface NewsFeedProps {
  initialCategory?: string;
  searchQuery?: string | null;
  allSources?: string[];
  selectedSource?: string;
  onSourceChange?: (source: string) => void;
}

function NewsFeedContent({ initialCategory, searchQuery, allSources: parentSources, selectedSource: parentSelectedSource, onSourceChange }: NewsFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || initialCategory;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [categorizing, setCategorizing] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>(parentSelectedSource || 'all');
  const [allSources, setAllSources] = useState<string[]>(parentSources || []);
  const [visibleCount, setVisibleCount] = useState(15); // Start with 15 articles
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [relatedStories, setRelatedStories] = useState<Record<string, Article[]>>({});

  // Reset to page 1 if category, source, or pageSize changes
  useEffect(() => {
    setVisibleCount(15);
  }, [category, selectedSource]);

  useEffect(() => {
    setLoading(true);
    setVisibleCount(15);
    setSelectedSource('all');
    if (searchQuery && searchQuery.length > 0) {
      fetch(`/api/news?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          let items = (data.items || []).sort((a: Article, b: Article) => {
            return (b.published || 0) - (a.published || 0);
          });
          items = dedupeArticles(items);
          setArticles(items);
          const uniqueSources = Array.from(new Set(items.map((item: Article) => item.origin?.title).filter(Boolean))) as string[];
          setAllSources(uniqueSources);
          if (onSourceChange) onSourceChange('all');
          setLoading(false);
        });
    } else {
      fetch('/api/news')
        .then(res => res.json())
        .then(data => {
          let items = (data.items || []).sort((a: Article, b: Article) => {
            return (b.published || 0) - (a.published || 0);
          });
          items = dedupeArticles(items);
          setArticles(items);
          const uniqueSources = Array.from(new Set(items.map((item: Article) => item.origin?.title).filter(Boolean))) as string[];
          setAllSources(uniqueSources);
          if (onSourceChange) onSourceChange('all');
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    if (parentSources && parentSources.length !== allSources.length) {
      setAllSources(parentSources);
    }
    if (parentSelectedSource && parentSelectedSource !== selectedSource) {
      setSelectedSource(parentSelectedSource);
    }
  }, [parentSources, parentSelectedSource]);

  // Compute related articles for each article
  const relatedMap: Record<string, any[]> = {};
  const SIMILARITY_THRESHOLD = 0.3;
  const MAX_RELATED = 3;
  articles.forEach((article, idx) => {
    const related = articles
      .filter((other, jdx) => idx !== jdx && jaccardSimilarity(article.title, other.title) >= SIMILARITY_THRESHOLD)
      .sort((a, b) => jaccardSimilarity(article.title, b.title) - jaccardSimilarity(article.title, a.title))
      .slice(0, MAX_RELATED);
    relatedMap[article.id] = related;
  });

  // Categorize articles using Ollama via /api/categorize
  useEffect(() => {
    if (articles.length === 0) return;
    let cancelled = false;
    async function categorizeAll() {
      setCategorizing(true);
      const newMap: Record<string, string[]> = { ...categories };
      for (const article of articles) {
        if (newMap[article.id]) continue;
        const text = `${article.title} ${article.summary?.content || ''}`;
        try {
          const res = await fetch('/api/categorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          });
          const data = await res.json();
          if (!cancelled) {
            newMap[article.id] = data.categories || [];
            setCategories(prev => ({ ...prev, ...newMap }));
          }
        } catch {
          // ignore errors
        }
      }
      setCategorizing(false);
    }
    categorizeAll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles]);

  // Extract all possible sources from all loaded articles
  useEffect(() => {
    setAllSources(Array.from(new Set(articles.map((item: Article) => item.origin?.title).filter(Boolean))) as string[]);
  }, [articles]);

  // Filter articles by category and source
  const filteredArticles = articles.filter(article => {
    const matchesCategory = !category || (categories[article.id] || []).some(cat => cat.toLowerCase() === category);
    const matchesSource = selectedSource === 'all' || article.origin?.title === selectedSource;
    return matchesCategory && matchesSource;
  });

  // Infinite scroll: show only up to visibleCount
  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;

  // Infinite scroll logic
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !isFetchingMore) {
      setIsFetchingMore(true);
      setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + 15, filteredArticles.length));
        setIsFetchingMore(false);
      }, 400); // Simulate loading delay
    }
  }, [hasMore, isFetchingMore, filteredArticles.length]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    };
    const observer = new window.IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [handleObserver]);

  const handleSourceClick = (source: string) => {
    setSelectedSource(source);
    // Update URL to reflect the source filter
    const params = new URLSearchParams(searchParams.toString());
    params.set('source', source);
    router.push(`/?${params.toString()}`);
  };

  // Fetch categories and related for visible articles only, no batching logic
  useEffect(() => {
    if (!loading) {
      const visibleArticles = filteredArticles.slice(0, visibleCount);
      // Only fetch for articles missing categories
      const missingCategories = visibleArticles.filter(article => !categories[article.id]);
      if (missingCategories.length > 0) {
        fetch('/api/categories/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articles: missingCategories }),
        })
          .then(res => res.json())
          .then(categoriesData => {
            const newCategories: Record<string, string[]> = {};
            categoriesData.results.forEach((result: { articleId: string; categories: string[] }) => {
              if (result.categories.length > 0) newCategories[result.articleId] = result.categories;
            });
            setCategories(prev => ({ ...prev, ...newCategories }));
          })
          .catch(() => {}); // Non-blocking, ignore errors
      }
      // Only fetch for articles missing related
      const missingRelated = visibleArticles.filter(article => !relatedStories[article.id]);
      if (missingRelated.length > 0) {
        fetch('/api/related/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articles: missingRelated }),
        })
          .then(res => res.json())
          .then(relatedData => {
            const newRelated: Record<string, Article[]> = {};
            relatedData.results.forEach((result: { articleId: string; related: Article[] }) => {
              if (result.related.length > 0) newRelated[result.articleId] = result.related;
            });
            setRelatedStories(prev => ({ ...prev, ...newRelated }));
          })
          .catch(() => {}); // Non-blocking, ignore errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, visibleCount, filteredArticles, categories, relatedStories]);

  // When source changes, notify parent
  useEffect(() => {
    if (onSourceChange) onSourceChange(selectedSource);
  }, [selectedSource]);

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;

  return (
    <div className="max-w-6xl mx-auto mt-0">
      {/* Top latest news row */}
      <div className="flex items-center justify-between mb-6 w-full sticky top-16 z-40 bg-gray-50">
        <div className="flex-1 min-w-0">
          {!category ? (
            <nav className="text-sm" aria-label="Breadcrumb">
              <ol className="list-reset flex text-gray-600">
                <li className="font-bold text-gray-900">Latest News</li>
              </ol>
            </nav>
          ) : (
            <nav className="text-sm" aria-label="Breadcrumb">
              <ol className="list-reset flex text-gray-600">
                <li>
                  <a href="/" className="hover:underline text-gray-800">Latest News</a>
                </li>
                <li>
                  <span className="mx-2">/</span>
                </li>
                <li className="font-bold text-gray-900">{category.charAt(0).toUpperCase() + category.slice(1)}</li>
              </ol>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedSource}
            onChange={(e) => {
              setSelectedSource(e.target.value);
              // Update URL to reflect the source filter
              const params = new URLSearchParams(searchParams.toString());
              params.set('source', e.target.value);
              router.push(`/?${params.toString()}`);
            }}
            className="w-48"
          >
            <option value="all">All Sources</option>
            {allSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.slice(0, visibleCount).map((article) => {
          const articleCategories = categories[article.id] || [];
          const related = relatedStories[article.id] || [];
          const summary = stripHtmlAndTruncate(article.summary?.content || '', 50);
          const thumbnail = extractThumbnail(article.summary?.content || '');
          return (
            <NewsCard
              key={article.id}
              article={article}
              summary={summary}
              thumbnail={thumbnail}
              related={related}
              categories={articleCategories}
              onSourceClick={handleSourceClick}
            />
          );
        })}
      </div>
      {/* Loader for infinite scroll */}
      <div ref={loaderRef} className="flex justify-center items-center h-16">
        {hasMore && <Spinner />}
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