
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { HiSun, HiMoon, HiSave } from 'react-icons/hi';

export default function PreferencesPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [theme, setTheme] = useState('system');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize preferences with stored values
  useEffect(() => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/');
      return;
    }
    
    // Load theme preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    }
  }, [user, router]);
  
  // Apply theme when it changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      // System preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.removeItem('theme');
    }
  }, [theme]);
  
  const handleSavePreferences = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      
      // Add a small delay to show the success message
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save preferences' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading preferences...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">User Preferences</h1>
        
        {message.text && (
          <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'}`}>
            {message.text}
          </div>
        )}
        
        <div className="space-y-6">
          {/* Theme selection */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Theme Preference</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`p-4 border rounded-lg flex flex-col items-center ${
                  theme === 'light' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <HiSun className="w-8 h-8 text-yellow-500 mb-2" />
                <span className="text-gray-900 dark:text-white font-medium">Light</span>
              </button>
              
              <button
                onClick={() => setTheme('dark')}
                className={`p-4 border rounded-lg flex flex-col items-center ${
                  theme === 'dark' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <HiMoon className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-gray-900 dark:text-white font-medium">Dark</span>
              </button>
              
              <button
                onClick={() => setTheme('system')}
                className={`p-4 border rounded-lg flex flex-col items-center ${
                  theme === 'system' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex mb-2">
                  <HiSun className="w-6 h-6 text-yellow-500" />
                  <span className="mx-1">/</span>
                  <HiMoon className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-gray-900 dark:text-white font-medium">System</span>
              </button>
            </div>
          </div>
          
          {/* Additional preferences can be added here */}
          
          {/* Save button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSavePreferences}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <HiSave className="w-5 h-5" />
              )}
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 