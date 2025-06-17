"use client";

export default function AdminRelatedArticlesPage() {
  return (
    <div className="max-w-4xl mx-auto mt-12 p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900 dark:text-white">Related Articles Management</h1>
      <p className="mb-8 text-lg text-gray-700 dark:text-gray-300">
        Edit and organize related articles. Force reload or edit related articles.
      </p>
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded shadow">
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Force Reload Related Articles</h2>
        <div className="text-gray-500 dark:text-gray-400 italic">TODO: Trigger reload of related articles.</div>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded shadow">
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Edit Related Articles</h2>
        <div className="text-gray-500 dark:text-gray-400 italic">TODO: Edit related articles.</div>
      </div>
    </div>
  );
} 