import { useState, useEffect, Suspense } from 'react';
import { Navbar as FlowbiteNavbar, Button } from 'flowbite-react';
import { HiSun, HiMoon, HiMenu, HiUserGroup, HiCollection, HiDatabase, HiCog, HiRefresh, HiArrowLeft } from 'react-icons/hi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ADMIN_LINKS = [
  { href: '/admin/users', label: 'Users', icon: HiUserGroup },
  { href: '/admin/categories', label: 'Categories', icon: HiCollection },
  { href: '/admin/sources', label: 'Sources', icon: HiDatabase },
  { href: '/admin/rebuild', label: 'Rebuild', icon: HiRefresh },
  { href: '/admin/settings', label: 'Settings', icon: HiCog },
];

export function AdminNavbarContent() {
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  return (
    <FlowbiteNavbar fluid className="sticky top-0 z-50 border-b relative bg-white dark:bg-gray-900">
      <FlowbiteNavbar.Brand href="/admin">
        <div className="flex flex-row items-center gap-3">
          <img src="/favicon.ico" alt="Admin Favicon" className="w-10 h-10" />
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight dark:text-white text-gray-900 leading-tight">Admin Dashboard</span>
            <span className="text-xs italic text-gray-500 dark:text-gray-300 text-right">NewsFeed Admin</span>
          </div>
        </div>
      </FlowbiteNavbar.Brand>
      <div className="flex items-center ml-auto">
        {/* Back to main site */}
        <Link href="/" className="hidden md:inline-flex items-center px-3 py-2 mr-4 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <HiArrowLeft className="w-5 h-5 mr-1" /> Main Site
        </Link>
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
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center px-2 py-1 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <link.icon className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="relative w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-md md:hidden z-50 overflow-y-auto max-h-screen">
          <div className="flex flex-col py-2">
            {ADMIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="w-5 h-5 mr-2" />
                <span>{link.label}</span>
              </Link>
            ))}
            {/* Back to main site */}
            <Link href="/" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <HiArrowLeft className="w-5 h-5 mr-2" /> Main Site
            </Link>
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

export default function AdminNavbar() {
  return (
    <Suspense fallback={<div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />}> 
      <AdminNavbarContent />
    </Suspense>
  );
} 