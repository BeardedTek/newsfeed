"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { HiUserGroup, HiCollection, HiDatabase, HiCog } from 'react-icons/hi';

const ADMIN_PAGES = [
  {
    href: '/admin/sources',
    title: 'Sources',
    description: 'Manage news sources and feeds. Uses FreshRSS API and advanced grouping/filtering.',
    icon: HiDatabase,
  },
  {
    href: '/admin/categories',
    title: 'Categories',
    description: 'Edit and organize news categories. Add new categories and refresh article assignments.',
    icon: HiCollection,
  },
  {
    href: '/admin/related-articles',
    title: 'Related Articles',
    description: 'Edit and organize related articles. Force reload or edit related articles.',
    icon: HiCollection,
  },
  {
    href: '/admin/settings',
    title: 'Settings',
    description: 'Configure admin and site settings. These settings override environment variables.',
    icon: HiCog,
  },
];

const ADMIN_ROLES = ['admin', 'poweruser'];
function hasAdminRole(user: any) {
  return user.roles && user.roles.some((role: any) => ADMIN_ROLES.includes(role.name) || ADMIN_ROLES.includes(role));
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4 dark:text-white">Admin Login Required</h1>
        <p className="text-gray-700 dark:text-gray-300">You must be logged in to access the admin dashboard.</p>
      </div>
    );
  }

  if (!hasAdminRole(user)) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4 dark:text-white">Access Denied</h1>
        <p className="text-gray-700 dark:text-gray-300">You do not have permission to access the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-4xl font-extrabold mb-6 text-gray-900 dark:text-white">Admin Dashboard</h1>
      <p className="mb-8 text-lg text-gray-700 dark:text-gray-300">Welcome, <span className="font-semibold">{user.name}</span>! Use the cards below to manage the application.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ADMIN_PAGES.map(page => {
          const Icon = page.icon;
          return (
            <Link
              key={page.href}
              href={page.href}
              className="block p-6 rounded-lg shadow bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-700"
            >
              <span className="flex items-center text-xl font-bold text-blue-700 dark:text-blue-400">
                <Icon className="w-6 h-6 mr-2" />
                {page.title}
              </span>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{page.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 