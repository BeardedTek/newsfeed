'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { Navbar as FlowbiteNavbar, Button, TextInput, Accordion } from 'flowbite-react';
import { HiSun, HiMoon, HiInformationCircle, HiMail, HiShieldCheck, HiSearch, HiMenu, HiChevronDown, HiUserGroup, HiCollection, HiDatabase, HiCog, HiRefresh, HiDocumentText } from 'react-icons/hi';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSearchContext } from '@/context/SearchContext';
import { useAuth, useEnv } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

const GitHubLogo = ({ className = "" }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

const ABOUT_LINKS = [
  { href: '/about', label: 'About NewsFeed', icon: HiInformationCircle },
  { href: '/contact', label: 'Contact Us', icon: HiMail },
  { href: '/docs/', label: 'Documentation', icon: HiDocumentText, external: true },
  { href: 'https://github.com/beardedtek/newsfeed', label: 'Github', icon: GitHubLogo, external: true },
];

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: HiUserGroup },
  { href: '/admin/sources', label: 'Sources', icon: HiDatabase },
  { href: '/admin/categories', label: 'Categories', icon: HiCollection },
  { href: '/admin/related-articles', label: 'Related Articles', icon: HiCollection },
  { href: '/admin/settings', label: 'Settings', icon: HiCog },
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
  const { user, logout } = useAuth();
  const env = useEnv();
  // Use the isAdmin property directly from the user object
  const isAdmin = user?.isAdmin || false;

  // Dropdown open state for About and Admin
  const [aboutOpen, setAboutOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const aboutRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        aboutRef.current && !aboutRef.current.contains(event.target as Node) &&
        adminRef.current && !adminRef.current.contains(event.target as Node) &&
        userMenuRef.current && !userMenuRef.current.contains(event.target as Node)
      ) {
        setAboutOpen(false);
        setAdminOpen(false);
        setUserMenuOpen(false);
      } else if (aboutRef.current && !aboutRef.current.contains(event.target as Node)) {
        setAboutOpen(false);
      } else if (adminRef.current && !adminRef.current.contains(event.target as Node)) {
        setAdminOpen(false);
      } else if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Casdoor login redirect handler
  const handleLogin = () => {
    const serverUrl = env.CASDOOR_SERVER_URL;
    const clientId = env.CASDOOR_CLIENT_ID;
    const appName = env.CASDOOR_APP_NAME;
    const orgName = env.CASDOOR_ORG_NAME;
    const redirectUri = env.CASDOOR_REDIRECT_URI;

    if (!serverUrl || !clientId || !appName || !orgName || !redirectUri) {
      alert("Missing Casdoor environment variables. Please check your configuration.");
      return;
    }

    // Add current path as a redirect param
    const currentPath = window.location.pathname + window.location.search;
    const authorizeUrl = `${serverUrl}/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid+profile+email&state=login&tenant=${encodeURIComponent(orgName)}&application=${encodeURIComponent(appName)}&redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = authorizeUrl;
  };

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isNewsfeed = pathname === '/' && (!searchParams || searchParams.size === 0 || searchParams.has('q'));

  return (
    <FlowbiteNavbar fluid className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900">
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
        <div className="hidden md:flex items-center ml-10 gap-2">
          {/* Search button styled as a nav link - only show on homepage or when searching */}
          {isNewsfeed && (
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
          )}
          {/* About dropdown */}
          <div className="relative ml-2" ref={aboutRef}>
            <button
              className="flex items-center px-2 py-1 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded cursor-pointer"
              onClick={() => {
                setAboutOpen((open) => !open);
                setAdminOpen(false);
              }}
              aria-haspopup="true"
              aria-expanded={aboutOpen}
            >
              <HiInformationCircle className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">About</span>
              <HiChevronDown className="w-4 h-4 ml-1" />
            </button>
            {aboutOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50">
                {ABOUT_LINKS.map((link) => (
                  link.external ? (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {link.icon && <link.icon className="w-4 h-4 mr-2" />}
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setAboutOpen(false)}
                    >
                      {link.icon && <link.icon className="w-4 h-4 mr-2" />}
                      {link.label}
                    </Link>
                  )
                ))}
              </div>
            )}
          </div>
          {/* Theme toggle */}
          <ThemeToggle />
          {/* Admin dropdown (if admin) */}
          {isAdmin && (
            <div className="relative ml-2" ref={adminRef}>
              <button
                className="flex items-center px-2 py-1 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded cursor-pointer"
                onClick={() => {
                  setAdminOpen((open) => !open);
                  setAboutOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={adminOpen}
              >
                <HiUserGroup className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Admin</span>
                <HiChevronDown className="w-4 h-4 ml-1" />
              </button>
              {adminOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50">
                  {ADMIN_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setAdminOpen(false)}
                    >
                      {link.icon && <link.icon className="w-4 h-4 mr-2" />}
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* User avatar dropdown or login button */}
          {user ? (
            <div className="relative ml-2" ref={userMenuRef}>
              <button
                className="flex items-center ml-2 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => {
                  setUserMenuOpen((open) => !open);
                  setAboutOpen(false);
                  setAdminOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={`${user.displayName || user.name}'s avatar`} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {(user.displayName || user.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName || user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/preferences"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Preferences
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 font-medium text-red-600 dark:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              className="flex items-center px-4 py-2 ml-2 text-white bg-blue-500 hover:bg-blue-600 rounded shadow-none border-none transition-colors"
              onClick={handleLogin}
              aria-label="Login"
            >
              <HiShieldCheck className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu - direct child of navbar */}
      {mobileMenuOpen && (
        <div className="relative w-full bg-white dark:bg-gray-900 shadow-md md:hidden z-50 overflow-y-auto max-h-screen">
          <div className="flex flex-col py-2">
          {/* Search button only on homepage or when searching */}
          {isNewsfeed && (
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
          )}
          {/* Accordion panels for About and Admin */}
          {(() => {
            const mobilePanels = [
              (
                <Accordion.Panel key="about">
                  <Accordion.Title className="px-4 justify-left text-left font-medium first:rounded-t-lg last:rounded-b-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:hover:bg-gray-800 dark:focus:ring-gray-800 flex items-center gap-2 px-0 py-3 text-gray-700 dark:text-gray-200 w-full">
                    <h2 className="px-4 flex items-center gap-2">
                      <HiInformationCircle className="w-5 h-5" />
                      <span className="flex-1 text-left">About</span>
                    </h2>
                  </Accordion.Title>
                  <Accordion.Content className="py-1 px-0">
                    {ABOUT_LINKS.map((link) => (
                      link.external ? (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.icon && <link.icon className="w-4 h-4 mr-2" />}
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.icon && <link.icon className="w-4 h-4 mr-2" />}
                          {link.label}
                        </Link>
                      )
                    ))}
                  </Accordion.Content>
                </Accordion.Panel>
              )
            ];
            if (isAdmin) {
              mobilePanels.push(
                <Accordion.Panel key="admin">
                  <Accordion.Title className="px-4 justify-left text-left font-medium first:rounded-t-lg last:rounded-b-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:hover:bg-gray-800 dark:focus:ring-gray-800 flex items-center gap-2 px-0 py-3 text-gray-700 dark:text-gray-200 w-full">
                    <h2 className="px-4 flex items-center gap-2">
                      <HiUserGroup className="w-5 h-5" />
                      <span className="flex-1 text-left">Admin</span>
                    </h2>
                  </Accordion.Title>
                  <Accordion.Content className="py-1 px-0">
                    {ADMIN_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.icon && <link.icon className="w-4 h-4 mr-2" />}
                        {link.label}
                      </Link>
                    ))}
                  </Accordion.Content>
                </Accordion.Panel>
              );
            }
            return (
              <Accordion collapseAll className="mb-0 border-0 rounded-none w-full">
                {mobilePanels}
              </Accordion>
            );
          })()}
            {/* User profile or login button for mobile */}
            {!user ? (
              <button
                onClick={handleLogin}
                className="flex items-center mx-4 my-2 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded shadow-none border-none transition-colors"
              >
                <HiShieldCheck className="w-5 h-5 mr-2" />
                <span>Login</span>
              </button>
            ) : (
              <div className="px-4 py-2">
                <div className="flex items-center gap-3 mb-2">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.displayName || user.name}'s avatar`} 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {(user.displayName || user.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName || user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-1 mt-3 border-t pt-2 dark:border-gray-700">
                  <Link
                    href="/profile"
                    className="block px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/preferences"
                    className="block px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Preferences
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="block w-full text-left px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 font-medium text-red-600 dark:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
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