'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AboutContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">About NewsFeed</h1>
      <div className="prose max-w-none">
        <p className="mb-4">
          NewsFeed is a modern news aggregation platform that brings together the latest stories from various sources,
          providing a personalized reading experience for each user.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-4">Our Mission</h2>
        <p className="mb-4">
          We aim to make staying informed easier and more enjoyable by:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Aggregating high-quality news from trusted sources</li>
          <li>Providing personalized content based on user preferences</li>
          <li>Offering a clean, distraction-free reading experience</li>
          <li>Making news accessible and easy to navigate</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-4">Features</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Personalized news feed based on your interests</li>
          <li>Category-based filtering and organization</li>
          <li>Related articles suggestions</li>
          <li>Customizable reading preferences</li>
          <li>Mobile-responsive design</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-4">Technology</h2>
        <p className="mb-4">
          Built with modern web technologies:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Next.js for the frontend and API routes</li>
          <li>Prisma for database management</li>
          <li>FreshRSS for news aggregation</li>
          <li>Redis for caching and performance</li>
          <li>Tailwind CSS for styling</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-4">Contact</h2>
        <p>
          Have questions or suggestions? We'd love to hear from you! Reach out to us at{' '}
          <a href="mailto:contact@beardedtek.com" className="text-blue-600 hover:underline">
            contact@beardedtek.com
          </a>
        </p>
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