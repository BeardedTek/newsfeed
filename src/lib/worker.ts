import { getCachedCategories, setCachedCategories, getCachedRelatedStories, setCachedRelatedStories, getCachedThumbnail, setCachedThumbnail } from './redis';
import sharp from 'sharp';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';
const CATEGORIES = [
  'Politics', 'US', 'World', 'Sports', 'Technology', 'Entertainment', 'Science', 'Health', 'Business'
];
const WORKER_INTERVAL = parseInt(process.env.WORKER_INTERVAL_MINUTES || '15', 10) * 60 * 1000;

const THUMB_SIZE = 96; // Tailwind h-24/w-24 = 6rem = 96px

async function categorizeArticle(text: string): Promise<string[]> {
  const prompt = `Given the following news article, assign all relevant categories from this list: ${CATEGORIES.join(', ')}. Return only a JSON array of category names.\n\nArticle:\n${text}\n\nCategories:`;
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt, stream: false }),
  });
  const data = await res.json();
  try {
    const match = data.response.match(/\[.*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
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

function extractThumbnailUrl(article: any): string | null {
  if (article.image && article.image.startsWith('http')) return article.image;
  if (article.alternate && Array.isArray(article.alternate)) {
    const alt = article.alternate.find((a: any) => a.href && a.href.match(/^https?:\/\//));
    if (alt) return alt.href;
  }
  if (article.content && typeof article.content === 'string') {
    const match = article.content.match(/<img[^>]+src=["']([^"'>]+)["']/i);
    if (match) return match[1];
  }
  return null;
}

async function fetchAndConvertToWebp(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const webp = await sharp(buffer)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' })
      .webp({ quality: 70 })
      .toBuffer();
    return `data:image/webp;base64,${webp.toString('base64')}`;
  } catch (e) {
    return null;
  }
}

async function processArticle(article: any, allArticles: any[]) {
  const text = article.title + ' ' + article.description;
  // Categories
  let categories = await getCachedCategories(text);
  if (!categories) {
    categories = await categorizeArticle(text);
    await setCachedCategories(text, categories);
  }
  // Related
  let related = await getCachedRelatedStories(article.id);
  if (!related) {
    const SIMILARITY_THRESHOLD = 0.3;
    const MAX_RELATED = 3;
    related = allArticles
      .filter((other: any) => other.id !== article.id && jaccardSimilarity(article.title, other.title) >= SIMILARITY_THRESHOLD)
      .sort((a: any, b: any) => jaccardSimilarity(article.title, b.title) - jaccardSimilarity(article.title, a.title))
      .slice(0, MAX_RELATED);
    await setCachedRelatedStories(article.id, related);
  }
  // Thumbnail
  let thumb = await getCachedThumbnail(article.id);
  if (!thumb) {
    const thumbUrl = extractThumbnailUrl(article);
    if (thumbUrl) {
      thumb = await fetchAndConvertToWebp(thumbUrl);
      if (thumb) {
        await setCachedThumbnail(article.id, thumb);
      }
    }
  }
}

export async function startWorker(articles: any[]) {
  // Initial run
  await Promise.all(articles.map(article => processArticle(article, articles)));
  // Schedule
  setInterval(async () => {
    await Promise.all(articles.map(article => processArticle(article, articles)));
  }, WORKER_INTERVAL);
} 