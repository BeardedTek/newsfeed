import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

const OLLAMA_URL = process.env.OLLLAMA_URL || process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const CATEGORIES = [
  'Politics', 'US', 'World', 'Sports', 'Technology', 'Entertainment', 'Science', 'Health', 'Business'
];

const redis = new Redis(REDIS_URL);

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  // Check if the text has already been categorized in Redis
  const cachedCategories = await redis.get(text);
  if (cachedCategories) {
    return NextResponse.json({ categories: JSON.parse(cachedCategories) });
  }

  const prompt = `Given the following news article, assign all relevant categories from this list: ${CATEGORIES.join(', ')}. Return only a JSON array of category names.\n\nArticle:\n${text}\n\nCategories:`;

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false
    }),
  });
  const data = await res.json();
  let categories: string[] = [];
  try {
    const match = data.response.match(/\[.*\]/);
    categories = match ? JSON.parse(match[0]) : [];
  } catch {
    categories = [];
  }

  // Store the categories in Redis
  await redis.set(text, JSON.stringify(categories), 'EX', 86400); // Cache for 24 hours

  return NextResponse.json({ categories });
} 