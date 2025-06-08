'use client';

import { useState, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Navbar as FlowbiteNavbar, Button, Dropdown, Avatar } from 'flowbite-react';
import { HiMenu, HiX, HiSearch } from 'react-icons/hi';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

const CATEGORIES = [
  'Politics', 'US', 'World', 'Sports', 'Technology', 'Entertainment', 'Science', 'Health', 'Business'
];

function NavbarContent({ onSearch }: { onSearch?: (query: string) => void }) {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');

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

  return (
    <>
      <FlowbiteNavbar fluid className="bg-white border-b border-gray-200 sticky top-0 z-50 flex flex-col">
        <div className="flex flex-row items-center justify-between w-full">
          <FlowbiteNavbar.Brand href="/">
            <img src="/logo.png" alt="NewsFeed Logo" className="h-12 w-auto" />
          </FlowbiteNavbar.Brand>
          <div className="flex flex-row items-center gap-4">
            <FlowbiteNavbar.Link href="#" onClick={() => setShowSearch(v => !v)}>
              <HiSearch className="inline-block mr-1" /> Search
            </FlowbiteNavbar.Link>
            <FlowbiteNavbar.Link href="/about">About</FlowbiteNavbar.Link>
            <FlowbiteNavbar.Link href="/privacy">Privacy</FlowbiteNavbar.Link>
            <FlowbiteNavbar.Link href="https://github.com/beardedtek/newsfeed" target="_blank" rel="noopener noreferrer">GitHub Repo</FlowbiteNavbar.Link>
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
        <FlowbiteNavbar.Collapse>
          <FlowbiteNavbar.Link href="/" className="font-bold text-black">Latest News</FlowbiteNavbar.Link>
          {CATEGORIES.map(category => (
            <FlowbiteNavbar.Link
              key={category}
              href={`/?category=${category.toLowerCase()}`}
            >
              {category}
            </FlowbiteNavbar.Link>
          ))}
        </FlowbiteNavbar.Collapse>
      </FlowbiteNavbar>
    </>
  );
}

export default function Navbar({ onSearch }: { onSearch?: (query: string) => void }) {
  return (
    <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
      <NavbarContent onSearch={onSearch} />
    </Suspense>
  );
} 