import { NextRequest, NextResponse } from 'next/server';
import { getCachedThumbnail } from '@/lib/redis';

export async function GET(req: NextRequest) {
  const articleId = req.nextUrl.searchParams.get('articleId');
  if (!articleId) {
    return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
  }
  const thumb = await getCachedThumbnail(articleId);
  return NextResponse.json({ thumb });
} 