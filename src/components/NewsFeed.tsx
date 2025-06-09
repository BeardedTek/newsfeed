'use client';

import { useEffect, useState, Suspense, useRef, useCallback, useMemo } from 'react';
import { Spinner, Badge, Select } from 'flowbite-react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Add these constants at the top of the file
const BATCH_SIZE = 10; // Maximum number of articles to send in a batch
const BATCH_DEBOUNCE_MS = 200; // Debounce delay in milliseconds

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
    summary: typeof article.summary === 'string' ? { content: article.summary } : article.summary,
    origin: typeof article.origin === 'string' ? { title: article.origin } : article.origin,
  };
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md p-3 max-w-2xl mb-4 flex flex-col h-full">
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
                  <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-1 rounded mr-2">
                    {article.origin.title}
                  </span>
                </button>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{formatDate(article.published * 1000)}</span>
            </div>
            <a href={article.url || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">
              <h2 className="text-lg font-semibold mb-1 dark:text-white">{article.title}</h2>
            </a>
          </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">{summary}</p>
        {related.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Related articles:</div>
            <div className="flex flex-col gap-1">
              {related.map((rel) => (
                <a
                  key={rel.id}
                  href={rel.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-black dark:text-gray-200 hover:underline"
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
              className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
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
  url?: string;
  categories?: string[];
}

interface NewsFeedProps {
  initialCategory?: string;
  searchQuery?: string | null;
  allSources?: string[];
  selectedSource?: string;
  onSourceChange?: (source: string) => void;
  onSourcesUpdate?: (sources: string[]) => void;
  initialArticles?: Article[];
}

const CATEGORIES = [
  'Politics', 'US', 'World', 'Sports', 'Technology', 'Entertainment', 'Science', 'Health', 'Business'
];

function NewsFeedContent({ initialCategory, searchQuery, allSources: parentSources, selectedSource: parentSelectedSource, onSourceChange, onSourcesUpdate, initialArticles }: NewsFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams?.get('category') || initialCategory;
  const [articles, setArticles] = useState<Article[]>(initialArticles ? initialArticles.map(normalizeArticle) : []);
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
      fetch(`${API_BASE}/articles?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          let items = (data.articles || []).sort((a: Article, b: Article) => {
            return (b.published || 0) - (a.published || 0);
          });
          items = dedupeArticles(items).map(normalizeArticle);
          setArticles(items);
          const uniqueSources = Array.from(new Set(items.map((item: Article) => item.origin?.title).filter(Boolean))) as string[];
          setAllSources(uniqueSources);
          if (onSourceChange) onSourceChange('all');
          setLoading(false);
        });
    } else {
      fetch(`${API_BASE}/articles`)
        .then(res => res.json())
        .then(data => {
          let items = (data.articles || []).sort((a: Article, b: Article) => {
            return (b.published || 0) - (a.published || 0);
          });
          items = dedupeArticles(items).map(normalizeArticle);
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

  // Compute related articles for each article (move to useMemo)
  const SIMILARITY_THRESHOLD = 0.3;
  const MAX_RELATED = 3;
  const relatedMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    articles.forEach((article, idx) => {
      const related = articles
        .filter((other, jdx) => idx !== jdx && jaccardSimilarity(article.title, other.title) >= SIMILARITY_THRESHOLD)
        .sort((a, b) => jaccardSimilarity(article.title, b.title) - jaccardSimilarity(article.title, a.title))
        .slice(0, MAX_RELATED);
      map[article.id] = related;
    });
    return map;
  }, [articles]);

  // Extract all possible sources from all loaded articles
  useEffect(() => {
    setAllSources(Array.from(new Set(articles.map((item: Article) => item.origin?.title).filter(Boolean))) as string[]);
  }, [articles]);

  // Filter articles by category and source
  const filteredArticles = articles.filter(article => {
    const articleCats = categories[article.id] || getCategories(article.title + ' ' + (article.summary?.content || ''));
    const matchesCategory = !category || articleCats.some(cat => cat.toLowerCase() === category);
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
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('source', source);
    router.push(`/?${params.toString()}`);
  };

  // Replace the useEffect for fetching categories and related with this updated version
  useEffect(() => {
    if (!loading) {
      const visibleArticles = filteredArticles.slice(0, visibleCount);
      // Only fetch for articles missing related or categories
      const missingRelated = visibleArticles.filter(article => !relatedStories[article.id]);
      const missingCategories = visibleArticles.filter(article => !categories[article.id]);
      
      // Test fetch for a single article's categories
      if (missingCategories.length > 0) {
        const testArticleId = missingCategories[0].id;
        fetch(`${API_BASE}/categories/${testArticleId}`)
          .then(res => {
            return res.json();
          })
          .then(data => {
          })
          .catch(err => {
          });
      }

      if (missingRelated.length > 0) {
        const batch = missingRelated.slice(0, BATCH_SIZE);
        const timeoutId = setTimeout(() => {
          // Fetch related articles
          fetch(`${API_BASE}/related/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batch.map(a => Number(a.id))),
          })
            .then(res => res.json())
            .then(relatedData => {
              const newRelated: Record<string, Article[]> = {};
              Object.entries(relatedData).forEach(([articleId, related]: [string, any]) => {
                if (related && related.length > 0) {
                  newRelated[articleId] = related.map((r: any) => ({
                    id: r,
                    title: articles.find(a => a.id === r)?.title || '',
                    summary: articles.find(a => a.id === r)?.summary || { content: '' },
                    published: articles.find(a => a.id === r)?.published || 0,
                    origin: articles.find(a => a.id === r)?.origin || { title: '' },
                    url: articles.find(a => a.id === r)?.url || '',
                    categories: articles.find(a => a.id === r)?.categories || []
                  }));
                }
              });
              setRelatedStories(prev => ({ ...prev, ...newRelated }));
            })
            .catch(err => {
            });
        }, BATCH_DEBOUNCE_MS);
        return () => clearTimeout(timeoutId);
      }

      if (missingCategories.length > 0) {
        const batch = missingCategories.slice(0, BATCH_SIZE);
        const timeoutId = setTimeout(() => {
          // Fetch categories
          fetch(`${API_BASE}/categories/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batch.map(a => Number(a.id))),
          })
            .then(res => {
              return res.json();
            })
            .then(categoryData => {
              const newCategories: Record<string, string[]> = {};
              Object.entries(categoryData).forEach(([articleId, data]: [string, any]) => {
                if (data && data.categories && data.categories.length > 0) {
                  newCategories[articleId] = data.categories;
                }
              });
              setCategories(prev => ({ ...prev, ...newCategories }));
            })
            .catch(err => {
            });
        }, BATCH_DEBOUNCE_MS);
        return () => clearTimeout(timeoutId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, visibleCount, filteredArticles, categories, relatedStories]);

  // When source changes, notify parent
  useEffect(() => {
    if (onSourceChange) onSourceChange(selectedSource);
  }, [selectedSource]);

  // Call onSourcesUpdate whenever allSources changes
  useEffect(() => {
    if (onSourcesUpdate) onSourcesUpdate(allSources);
  }, [allSources]);

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;

  return (
    <div className="dark:bg-gray-900 max-w-6xl mx-auto mt-0">
      {/* Top latest news row */}
      <div className="flex items-center justify-between mb-6 w-full sticky top-16 z-40 bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 min-w-0">
          {!category ? (
            <nav className="text-sm" aria-label="Breadcrumb">
              <ol className="list-reset flex text-gray-600 dark:text-gray-300">
                <li className="font-bold text-gray-900 dark:text-white">Latest News</li>
              </ol>
            </nav>
          ) : (
            <nav className="text-sm" aria-label="Breadcrumb">
              <ol className="list-reset flex text-gray-600 dark:text-gray-300">
                <li>
                  <a href="/" className="hover:underline text-gray-800 dark:text-gray-200">Latest News</a>
                </li>
                <li>
                  <span className="mx-2">/</span>
                </li>
                <li className="font-bold text-gray-900 dark:text-white">{category.charAt(0).toUpperCase() + category.slice(1)}</li>
              </ol>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Sources select */}
          <Select
            value={selectedSource}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setSelectedSource(e.target.value);
              // Update URL to reflect the source filter
              const params = new URLSearchParams(searchParams?.toString() || '');
              params.set('source', e.target.value);
              router.push(`/?${params.toString()}`);
            }}
            className="w-48 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
          >
            <option value="all" className="bg-white dark:bg-gray-800 dark:text-gray-200">All Sources</option>
            {allSources.map(source => (
              <option key={source} value={source} className="bg-white dark:bg-gray-800 dark:text-gray-200">{source}</option>
            ))}
          </Select>
          {/* Categories select */}
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
            className="w-48 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
          >
            <option value="" className="bg-white dark:bg-gray-800 dark:text-gray-200">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat.toLowerCase()} className="bg-white dark:bg-gray-800 dark:text-gray-200">{cat}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.slice(0, visibleCount).map((article) => {
          const articleCategories = article.categories || [];
          const related = relatedMap[article.id] || [];
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