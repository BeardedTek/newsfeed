import { NextRequest, NextResponse } from 'next/server';
import { getCachedRelatedStories } from '@/lib/redis';
import { startWorker } from '@/lib/worker';

export async function POST(req: NextRequest) {
  const { articles } = await req.json();
  if (!articles || !Array.isArray(articles)) {
    return NextResponse.json({ error: 'Missing or invalid articles array' }, { status: 400 });
  }

  // Get related stories for all articles from Redis
  const results = await Promise.all(
    articles.map(async (article: any) => {
      const related = await getCachedRelatedStories(article.id);
      return {
        articleId: article.id,
        related: related || []
      };
    })
  );

  // Find uncached articles
  const uncachedArticles = articles.filter((article: any) => {
    const result = results.find((r: any) => r.articleId === article.id);
    return !result?.related.length;
  });

  // Trigger worker for uncached articles (in background)
  if (uncachedArticles.length > 0) {
    startWorker(uncachedArticles).catch(console.error);
  }

  return NextResponse.json({ results });
} 