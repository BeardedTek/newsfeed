"use client";
import { useAuth } from '@/context/AuthContext';

const ADMIN_ROLES = ['admin', 'poweruser'];
function hasAdminRole(user: any) {
  return user.roles && user.roles.some((role: any) => ADMIN_ROLES.includes(role.name));
}

export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <div className="max-w-2xl mx-auto mt-16 p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md text-center">Admin Login Required</div>;
  if (!hasAdminRole(user)) return <div className="max-w-2xl mx-auto mt-16 p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md text-center">Access Denied</div>;
  return (
    <div className="max-w-4xl mx-auto mt-12 p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900 dark:text-white">Settings Management</h1>
      <p className="mb-8 text-lg text-gray-700 dark:text-gray-300">
        Configure admin and site settings. These settings should override environment variables.
      </p>
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded shadow">
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Site Settings</h2>
        <div className="text-gray-500 dark:text-gray-400 italic">TODO: Manage site settings (override environment variables).</div>
      </div>
    </div>
  );
} 