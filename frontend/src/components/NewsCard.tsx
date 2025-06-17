import React, { useState, useEffect } from 'react';
import { Article } from '../types/article';

interface NewsCardProps {
  article: Article;
  summary: string;
  thumbnail: string | null;
  related: { id: string; title: string; url: string }[];
  categories: string[];
  onSourceClick: (source: string) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, summary, thumbnail, related, categories, onSourceClick }) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(thumbnail);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchThumbnail = async () => {
      if (thumbnail) {
        setThumbUrl(thumbnail);
        return;
      }

      try {
        const response = await fetch(`/api/thumbnails/${article.id}`);
        if (response.ok) {
          const data = await response.json();
          setThumbUrl(data.thumbnail_url);
        }
      } catch (error) {
        console.error('Error fetching thumbnail:', error);
      }
    };

    if (!imageError && !thumbUrl) {
      fetchThumbnail();
    }
  }, [article.id, imageError, thumbnail, thumbUrl]);

  const handleImageError = () => {
    setImageError(true);
    setThumbUrl(null);
  };
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Add bottom padding class if categories exist
  const containerClasses = `bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md p-3 max-w-2xl mb-4 flex flex-col h-full relative ${categories && categories.length > 0 ? 'pb-4' : ''}`;
  return (
    <div className={containerClasses}>
      {/* Top row: Source (left), Date (right) */}
      <div className="flex items-center gap-2 mb-2">
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
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          {formatDate(article.published * 1000)}
        </span>
      </div>
      {/* Second row: Image and Headline */}
      <div className="flex items-start gap-4 mb-2">
        <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={article.title}
              className="w-full h-full object-cover aspect-square"
              onError={handleImageError}
            />
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">No image</span>
          )}
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline flex-1 min-w-0 text-gray-900 dark:text-white"
        >
          <h2 className="text-lg font-semibold mb-1 line-clamp-2">{article.title}</h2>
        </a>
      </div>
      {/* Third row: Summary */}
      <p className="text-gray-700 dark:text-gray-300 text-sm mb-2 line-clamp-4">{summary}</p>
      {/* Related articles */}
      {related && related.length > 0 && (
        <div className="mt-2 mb-12">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Related articles:</div>
          <ul className="list-disc pl-5 space-y-1">
            {related.map((rel) => (
              <li key={rel.id}>
                <a
                  href={rel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-gray-900 dark:text-gray-200 hover:underline"
                >
                  {rel.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Categories - pinned to absolute bottom right */}
      {categories && categories.length > 0 && (
        <div className="absolute bottom-3 right-0 w-full px-4">
          <div className="flex flex-row flex-wrap gap-2 justify-end">
            {categories.map((category: string) => (
              <a
                key={category}
                href={`/?category=${category.toLowerCase()}`}
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-2 py-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {category}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsCard;