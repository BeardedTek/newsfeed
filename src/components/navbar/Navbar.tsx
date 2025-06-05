'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Navbar as FlowbiteNavbar, Button, Dropdown, Avatar } from 'flowbite-react';
import { HiMenu, HiX } from 'react-icons/hi';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

const CATEGORIES = [
  'Politics', 'US', 'World', 'Sports', 'Technology', 'Entertainment', 'Science', 'Health', 'Business'
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category');

  return (
    <FlowbiteNavbar fluid className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <FlowbiteNavbar.Brand href="/">
        <img src="/logo.png" alt="NewsFeed Logo" className="h-12 w-auto" />
      </FlowbiteNavbar.Brand>

      <div className="flex md:order-2">
        {status === 'loading' ? (
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        ) : session ? (
          <Dropdown
            arrowIcon={false}
            inline
            label={
              <Avatar
                alt="User settings"
                img={session.user?.image || undefined}
                rounded
                size="sm"
              />
            }
          >
            <Dropdown.Header>
              <span className="block text-sm">{session.user?.name}</span>
              <span className="block truncate text-sm font-medium">
                {session.user?.email}
              </span>
            </Dropdown.Header>
            <Dropdown.Item as={Link} href="/profile">
              Profile
            </Dropdown.Item>
            <Dropdown.Item as={Link} href="/preferences">
              Preferences
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => signOut()}>
              Sign out
            </Dropdown.Item>
          </Dropdown>
        ) : (
          <a
            href="#"
            onClick={e => { e.preventDefault(); signIn('casdoor', { callbackUrl: '/' }); }}
            className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Sign In
          </a>
        )}
        <FlowbiteNavbar.Toggle className="ml-2" />
      </div>

      <FlowbiteNavbar.Collapse>
        <FlowbiteNavbar.Link href="/" className={!selectedCategory ? 'font-bold text-black' : ''}>Latest News</FlowbiteNavbar.Link>
        {CATEGORIES.map(category => {
          const isActive = selectedCategory === category.toLowerCase();
          return (
            <FlowbiteNavbar.Link
              key={category}
              href={`/?category=${category.toLowerCase()}`}
              className={isActive ? 'font-bold text-black' : ''}
            >
              {category}
            </FlowbiteNavbar.Link>
          );
        })}
      </FlowbiteNavbar.Collapse>
    </FlowbiteNavbar>
  );
} 