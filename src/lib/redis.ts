import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL);

// 5 days in seconds
const CACHE_DURATION = 5 * 24 * 60 * 60;

export async function getCachedCategories(text: string): Promise<string[] | null> {
  const data = await redis.get(`categories:${text}`);
  return data ? JSON.parse(data) : null;
}

export async function setCachedCategories(text: string, categories: string[]): Promise<void> {
  await redis.setex(`categories:${text}`, CACHE_DURATION, JSON.stringify(categories));
}

export async function getCachedRelatedStories(articleId: string): Promise<any[] | null> {
  const data = await redis.get(`related:${articleId}`);
  return data ? JSON.parse(data) : null;
}

export async function setCachedRelatedStories(articleId: string, related: any[]): Promise<void> {
  await redis.setex(`related:${articleId}`, CACHE_DURATION, JSON.stringify(related));
}

export async function getCachedThumbnail(articleId: string): Promise<string | null> {
  return await redis.get(`thumb:${articleId}`);
}

export async function setCachedThumbnail(articleId: string, thumbUrl: string): Promise<void> {
  await redis.setex(`thumb:${articleId}`, CACHE_DURATION, thumbUrl);
} 