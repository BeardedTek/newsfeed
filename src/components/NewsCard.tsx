import React, { useState, useEffect } from 'react';
import { Badge } from 'flowbite-react';

interface Article {
  id: string;
  title: string;
  description: string;
  link: string;
  published: number;
  image?: string;
  categories?: { name: string }[];
  origin?: {
    title: string;
  };
}

interface NewsCardProps {
  article: Article;
  categories: string[];
  relatedStories: Article[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function NewsCard({ article, categories, relatedStories }: NewsCardProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Only fetch if we don't already have a thumbnail
    if (!thumbUrl) {
      async function fetchThumb() {
        setImageError(false);
        const res = await fetch(`${API_BASE}/thumbnails/${encodeURIComponent(article.id)}`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.thumbnail_url) {
            setThumbUrl(data.thumbnail_url);
            return;
          }
        }
        // Fallback to article.image
        setThumbUrl(article.image || null);
      }
      fetchThumb();
    }
    return () => { cancelled = true; };
    // Only re-run if article.id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.id]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      {thumbUrl && !imageError ? (
        <img
          src={thumbUrl}
          alt={article.title}
          className="w-full h-48 object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">No image available</span>
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <h2 className="text-lg font-semibold mb-2 line-clamp-2">{article.title}</h2>
        <p className="text-gray-600 mb-4 line-clamp-3">{article.description}</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {categories.map((category) => (
            <Badge key={category} color="info">
              {category}
            </Badge>
          ))}
        </div>
        {relatedStories.length > 0 && (
          <div className="mt-2">
            <h3 className="text-sm font-semibold mb-1">Related Stories</h3>
            <ul className="space-y-1">
              {relatedStories.map((related) => (
                <li key={related.id} className="text-xs">
                  <a href={related.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {related.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-auto flex justify-between items-center pt-2">
          <span className="text-xs text-gray-500">
            {new Date(article.published * 1000).toLocaleDateString()}
          </span>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-xs"
          >
            Read more
          </a>
        </div>
      </div>
    </div>
  );
} 