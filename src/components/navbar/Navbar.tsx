'use client';

import { useState, useEffect, Suspense } from 'react';
import { Navbar as FlowbiteNavbar, Button, TextInput } from 'flowbite-react';
import { HiSun, HiMoon, HiInformationCircle, HiMail, HiShieldCheck, HiSearch, HiMenu } from 'react-icons/hi';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSearchContext } from '@/context/SearchContext';

const GitHubLogo = ({ className = "" }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

const NAV_LINKS = [
  {
    href: '/about',
    label: 'About',
    icon: HiInformationCircle,
    sr: 'About',
  },
  {
    href: '/contact',
    label: 'Contact',
    icon: HiMail,
    sr: 'Contact',
  },
  {
    href: '/privacy',
    label: 'Privacy',
    icon: HiShieldCheck,
    sr: 'Privacy Policy',
  },
  {
    href: 'https://github.com/beardedtek/newsfeed',
    label: 'newsfeed',
    icon: GitHubLogo,
    sr: 'GitHub',
    external: true,
  },
];

export function NavbarContent() {
  // Restore dark mode persistence
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      // Default to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [searchQuery, setSearchQuery] = useState('');
  const { showSearch, toggleSearch, setShowSearch } = useSearchContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setShowSearch(!!searchParams?.has('q'));
  }, [searchParams, setShowSearch]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <FlowbiteNavbar fluid className="sticky top-0 z-50 border-b relative">
      <FlowbiteNavbar.Brand href="/">
        <div className="flex flex-row items-center gap-3">
          {/* Column 1: Favicon */}
          <img src="/favicon.ico" alt="NewsFeed Favicon" className="w-10 h-10" />
          {/* Column 2: Title and Subtitle */}
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight dark:text-white text-gray-900 leading-tight">NewsFeed</span>
            <span className="text-xs italic text-gray-500 dark:text-gray-300 text-right">News without Algorithms</span>
          </div>
        </div>
      </FlowbiteNavbar.Brand>

      <div className="flex items-center ml-auto">
        {/* Hamburger icon for mobile */}
        <button
          className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          <HiMenu className="w-7 h-7 text-gray-700 dark:text-gray-200" />
        </button>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center ml-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center px-2 py-1 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                link.href === '/search' ? 'cursor-pointer' : ''
              }`}
              onClick={link.href === '/search' ? (e) => { e.preventDefault(); toggleSearch(); } : undefined}
            >
              <link.icon className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          ))}
          {/* Search button styled as a nav link */}
          <button
            type="button"
            aria-label="Toggle search bar"
            onClick={toggleSearch}
            className={`flex items-center px-2 py-1 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded cursor-pointer ${showSearch ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            style={{ border: 'none', background: 'none' }}
          >
            <HiSearch className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Search</span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu - direct child of navbar */}
      {mobileMenuOpen && (
        <div className="relative w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-md md:hidden z-50 overflow-y-auto max-h-screen">
          <div className="flex flex-col py-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                  link.href === '/search' ? 'cursor-pointer' : ''
                }`}
                onClick={link.href === '/search' ? (e) => { e.preventDefault(); toggleSearch(); setMobileMenuOpen(false); } : () => setMobileMenuOpen(false)}
              >
                <link.icon className="w-5 h-5 mr-2" />
                <span>{link.label}</span>
              </Link>
            ))}
            {/* Search button styled as a nav link */}
            <button
              type="button"
              aria-label="Toggle search bar"
              onClick={() => { toggleSearch(); setMobileMenuOpen(false); }}
              className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded cursor-pointer ${showSearch ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
              style={{ border: 'none', background: 'none' }}
            >
              <HiSearch className="w-5 h-5 mr-2" />
              <span>Search</span>
            </button>
            {/* Mobile light/dark mode toggle */}
            <Button
              color="gray"
              pill
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="mt-2 mx-4 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 flex md:hidden"
            >
              {isDarkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      )}

      {/* Desktop light/dark mode toggle */}
      <Button
        color="gray"
        pill
        onClick={() => setIsDarkMode((prev) => !prev)}
        className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 hidden md:inline-flex"
      >
        {isDarkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
      </Button>
    </FlowbiteNavbar>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />}>
      <NavbarContent />
    </Suspense>
  );
} 