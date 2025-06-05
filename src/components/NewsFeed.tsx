'use client';

import { useEffect, useState, Suspense } from 'react';
import { Spinner, Badge } from 'flowbite-react';
import { useSearchParams } from 'next/navigation';

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

function NewsCard({ article, summary, thumbnail, related, categories }: { article: any, summary: string, thumbnail: string | null, related: any[], categories: string[] }) {
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
                <Badge color="info">{article.origin.title}</Badge>
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

interface NewsFeedProps {
  initialCategory?: string;
}

function NewsFeedContent({ initialCategory }: NewsFeedProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || initialCategory;
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string[]>>({});
  const [categorizing, setCategorizing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 if category or pageSize changes
  useEffect(() => {
    setPage(1);
  }, [category, pageSize]);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        let items = (data.items || []).sort((a: any, b: any) => {
          return (b.published || 0) - (a.published || 0);
        });
        items = dedupeArticles(items);
        setArticles(items);
        setLoading(false);
      });
  }, []);

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
      const newMap: Record<string, string[]> = { ...categoriesMap };
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
            setCategoriesMap({ ...newMap });
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

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;

  const filteredArticles = category
    ? articles.filter(article => {
        const categories = categoriesMap[article.id] || [];
        return categories.some(cat => cat.toLowerCase() === category);
      })
    : articles;

  // Pagination logic
  const totalArticles = filteredArticles.length;
  const totalPages = Math.ceil(totalArticles / pageSize);
  const paginatedArticles = filteredArticles.slice((page - 1) * pageSize, page * pageSize);

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
        {totalPages > 1 && (
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 rounded border ${page === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 mx-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded border ${page === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Next
            </button>
          </div>
        )}
        <div className="flex-1 flex justify-end items-center">
          <label htmlFor="pageSize" className="mr-2 text-sm text-gray-700">Articles per page:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedArticles.map(article => {
          const summaryHtml = article.summary?.content || '';
          const thumbnail = extractThumbnail(summaryHtml);
          const summary = stripHtmlAndTruncate(summaryHtml, 30);
          const related = relatedMap[article.id] || [];
          const categories = categoriesMap[article.id] || [];
          return (
            <NewsCard
              key={article.id}
              article={article}
              summary={summary}
              thumbnail={thumbnail}
              related={related}
              categories={categories}
            />
          );
        })}
      </div>
      {/* Bottom latest news row */}
      <div className="flex items-center justify-between mt-6 w-full bg-gray-50">
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
        {totalPages > 1 && (
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 rounded border ${page === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 mx-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded border ${page === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Next
            </button>
          </div>
        )}
        <div className="flex-1 flex justify-end items-center">
          <label htmlFor="pageSize-bottom" className="mr-2 text-sm text-gray-700">Articles per page:</label>
          <select
            id="pageSize-bottom"
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
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