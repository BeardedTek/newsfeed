'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AboutContent() {
  const searchParams = useSearchParams();
  const section = searchParams?.get('section') || 'overview';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">About NewsFeed</h1>
      
      <div className="flex space-x-4 mb-6">
        <a
          href="?section=overview"
          className={`px-4 py-2 rounded ${
            section === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Overview
        </a>
        <a
          href="?section=features"
          className={`px-4 py-2 rounded ${
            section === 'features' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Features
        </a>
        <a
          href="?section=technology"
          className={`px-4 py-2 rounded ${
            section === 'technology' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Technology
        </a>
      </div>

      <div className="prose max-w-none">
        {section === 'overview' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="mb-4">
              NewsFeed is a modern news aggregator that brings together content from various sources,
              providing a personalized and efficient way to stay informed. Our platform uses advanced
              AI to categorize articles and find related content, making it easier to discover
              relevant news and stories.
            </p>
            <p>
              Whether you're looking for the latest headlines, specific topics, or related articles,
              NewsFeed helps you navigate through the vast amount of information available online.
            </p>
          </div>
        )}

        {section === 'features' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI-powered article categorization</li>
              <li>Related article suggestions</li>
              <li>Source filtering and management</li>
              <li>Responsive design for all devices</li>
              <li>Real-time updates from multiple sources</li>
              <li>Customizable reading experience</li>
        </ul>
          </div>
        )}

        {section === 'technology' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Frontend</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Next.js 14</li>
                  <li>React</li>
                  <li>TypeScript</li>
                  <li>Material-UI</li>
                  <li>Tailwind CSS</li>
        </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Backend</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>FastAPI</li>
                  <li>Python</li>
                  <li>Celery</li>
                  <li>FreshRSS API</li>
        </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AboutContent />
    </Suspense>
  );
} 