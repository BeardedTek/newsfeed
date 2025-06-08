'use client';

import { useState, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Navbar as FlowbiteNavbar, Button, Dropdown, Avatar } from 'flowbite-react';
import { HiMenu, HiX, HiSearch, HiChevronDown } from 'react-icons/hi';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

const CATEGORIES = [
  'Politics', 'US', 'World', 'Sports', 'Technology', 'Entertainment', 'Science', 'Health', 'Business'
];

const GitHubLogo = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5 mr-1 inline-block align-text-bottom" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

function NavbarContent({ onSearch, allSources = [], selectedSource = 'all', onSourceChange }: {
  onSearch?: (query: string) => void,
  allSources?: string[],
  selectedSource?: string,
  onSourceChange?: (source: string) => void
}) {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const handleSearch = () => {
    if (onSearch && searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Close categories dropdown on click outside
  // (simple implementation for now)
  function handleBlurCategories(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setShowCategories(false);
    }
  }

  function handleBlurSources(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setShowSources(false);
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full">
      <div className="container mx-auto flex flex-row items-center justify-between py-2 px-4">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="NewsFeed Logo" className="h-12 w-auto" />
        </Link>
        <div className="flex flex-row flex-wrap items-center gap-2 md:gap-4">
          <Link href="/" className="font-bold text-black px-2 py-1 hover:underline">Latest News</Link>
          <div className="relative" tabIndex={0} onBlur={handleBlurCategories}>
            <button
              className="flex items-center px-2 py-1 hover:underline text-black"
              onClick={() => setShowCategories(v => !v)}
              aria-haspopup="true"
              aria-expanded={showCategories}
              type="button"
            >
              Categories <HiChevronDown className="ml-1" />
            </button>
            {showCategories && (
              <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col">
                {CATEGORIES.map(category => (
                  <Link
                    key={category}
                    href={`/?category=${category.toLowerCase()}`}
                    className="px-4 py-2 hover:bg-gray-100 text-left"
                    onClick={() => setShowCategories(false)}
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="relative" tabIndex={0} onBlur={handleBlurSources}>
            <button
              className="flex items-center px-2 py-1 hover:underline text-black"
              onClick={() => setShowSources(v => !v)}
              aria-haspopup="true"
              aria-expanded={showSources}
              type="button"
            >
              Sources <HiChevronDown className="ml-1" />
            </button>
            {showSources && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col max-h-64 overflow-y-auto">
                <button
                  className={`px-4 py-2 text-left hover:bg-gray-100 ${selectedSource === 'all' ? 'font-bold' : ''}`}
                  onClick={() => { onSourceChange && onSourceChange('all'); setShowSources(false); }}
                >
                  All Sources
                </button>
                {allSources.map(source => (
                  <button
                    key={source}
                    className={`px-4 py-2 text-left hover:bg-gray-100 ${selectedSource === source ? 'font-bold' : ''}`}
                    onClick={() => { onSourceChange && onSourceChange(source); setShowSources(false); }}
                  >
                    {source}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="flex items-center px-2 py-1 hover:underline text-black"
            onClick={() => setShowSearch(v => !v)}
          >
            <HiSearch className="inline-block mr-1" /> Search
          </button>
          <Link href="/about" className="px-2 py-1 hover:underline">About</Link>
          <Link href="/contact" className="px-2 py-1 hover:underline">Contact</Link>
          <Link href="/privacy" className="px-2 py-1 hover:underline">Privacy</Link>
          <Link href="https://github.com/beardedtek/newsfeed" target="_blank" rel="noopener noreferrer" className="px-2 py-1 hover:underline flex items-center">
            <GitHubLogo /> <span className="ml-1">newsfeed</span>
          </Link>
        </div>
      </div>
      {showSearch && (
        <div className="w-full flex items-center bg-gray-50 border-t border-b border-gray-200 px-4 py-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search articles..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r flex items-center"
            onClick={handleSearch}
            aria-label="Search"
          >
            <HiSearch className="w-5 h-5" />
          </button>
        </div>
      )}
    </nav>
  );
}

export default function Navbar({ onSearch, allSources, selectedSource, onSourceChange }: {
  onSearch?: (query: string) => void,
  allSources?: string[],
  selectedSource?: string,
  onSourceChange?: (source: string) => void
}) {
  return (
    <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
      <NavbarContent onSearch={onSearch} allSources={allSources} selectedSource={selectedSource} onSourceChange={onSourceChange} />
    </Suspense>
  );
} 