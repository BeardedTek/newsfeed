import { NextRequest, NextResponse } from 'next/server';
import { getCachedCategories, setCachedCategories } from '@/lib/redis';
import { startWorker } from '@/lib/worker';

export async function POST(req: NextRequest) {
  const { articles } = await req.json();
  if (!articles || !Array.isArray(articles)) {
    return NextResponse.json({ error: 'Missing or invalid articles array' }, { status: 400 });
  }

  // Get categories for all articles from Redis
  const results = await Promise.all(
    articles.map(async (article: any) => {
      const text = article.title + ' ' + article.description;
      const categories = await getCachedCategories(text);
      return {
        articleId: article.id,
        categories: categories || []
      };
    })
  );

  // Find uncached articles
  const uncachedArticles = articles.filter((article: any) => {
    const result = results.find((r: any) => r.articleId === article.id);
    return !result?.categories.length;
  });

  // Trigger worker for uncached articles (in background)
  if (uncachedArticles.length > 0) {
    startWorker(uncachedArticles).catch(console.error);
  }

  return NextResponse.json({ results });
} 