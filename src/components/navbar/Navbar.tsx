'use client';

import { useState, useEffect, Suspense } from 'react';
import { Navbar as FlowbiteNavbar, Button } from 'flowbite-react';
import { HiSun, HiMoon, HiInformationCircle, HiMail, HiShieldCheck } from 'react-icons/hi';
import Link from 'next/link';

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

function getInitialTheme() {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') return true;
  if (saved === 'light') return false;
  // Fallback to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function NavbarContent() {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <FlowbiteNavbar fluid className="sticky top-0 z-50 border-b">
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
      <div className="flex md:order-2 gap-2 items-center">
        <Button
          color={isDarkMode ? 'gray' : 'light'}
          onClick={toggleDarkMode}
          className="px-3"
        >
          {isDarkMode ? (
            <HiSun className="h-5 w-5" />
          ) : (
            <HiMoon className="h-5 w-5" />
          )}
        </Button>
      </div>
      <div className="flex flex-row gap-2 md:gap-2 ml-2">
        {NAV_LINKS.map(({ href, label, icon: Icon, sr, external }) => (
          <Link
            key={href}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="flex items-center px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon className="w-5 h-5 md:mr-2 text-gray-900 dark:text-white" aria-hidden="true" />
            <span className="hidden md:inline font-bold">{label}</span>
          </Link>
        ))}
      </div>
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