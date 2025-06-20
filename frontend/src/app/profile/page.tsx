'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useEnv } from '@/context/AuthContext';
import { HiUpload, HiPencil, HiKey, HiSave, HiX, HiUser } from 'react-icons/hi';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const env = useEnv();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>('');
  const [address1, setAddress1] = useState<string>('');
  const [address2, setAddress2] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'warning' | '';
    text: string;
  }>({ type: '', text: '' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.name || '');
      setAvatarUrl(user.avatar || '');
      setAvatarPreview(user.avatar || '');
      setPhone(user.phone || '');
      
      // Handle address array
      if (user.address && Array.isArray(user.address)) {
        setAddress1(user.address[0] || '');
        setAddress2(user.address[1] || '');
      } else {
        setAddress1('');
        setAddress2('');
      }
    } else {
      // Redirect to login if not authenticated
      router.push('/');
    }
  }, [user, router]);
  
  // Fetch user profile to get Gravatar URL
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const response = await fetch('/api/user/profile', {
            method: 'GET',
            credentials: 'include',
          });
          
          if (!response.ok) {
            console.error('Error fetching profile:', response.status);
            return;
          }
          
          const data = await response.json();
          if (data.data && data.data.gravatar_url) {
            setGravatarUrl(data.data.gravatar_url);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };
      
      fetchProfile();
    }
  }, [user]);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload the file
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }
      
      setAvatarUrl(data.avatarUrl);
      setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to upload avatar' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUseGravatar = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await fetch('/api/user/use-gravatar', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAvatarPreview(data.avatarUrl);
        setAvatarUrl(data.avatarUrl);
        setMessage({ type: 'success', text: 'Gravatar set as your avatar!' });
      }
    } catch (error) {
      console.error('Error setting Gravatar:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to set Gravatar' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName,
          avatar: avatarPreview !== user?.avatar ? avatarPreview : undefined,
          phone,
          address: [address1, address2].filter(Boolean),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      // Update the user context with new data
      await refreshUser();
      
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetPassword = () => {
    if (!env.CASDOOR_SERVER_URL || !user) return;
    
    // Redirect to Casdoor password reset page
    const resetUrl = `${env.CASDOOR_SERVER_URL}/password/reset/${user.name}`;
    window.open(resetUrl, '_blank');
  };
  
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">User Profile</h1>
        
        {message.text && (
          <div className={`mb-4 p-3 rounded ${
            message.type === 'error' 
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' 
              : message.type === 'warning'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar section */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="User avatar" 
                  className="w-32 h-32 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-500 dark:text-gray-400">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2"
                  disabled={isLoading}
                >
                  <HiUpload className="w-4 h-4" />
                </button>
              )}
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={isLoading}
              />
            </div>
            
            {isEditing && (
              <div className="w-full mt-2">
                {gravatarUrl && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Gravatar
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src={gravatarUrl} 
                        alt="Gravatar" 
                        className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        onClick={handleUseGravatar}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md flex items-center gap-1"
                        disabled={isLoading}
                      >
                        <HiUser className="w-4 h-4" />
                        Use Gravatar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Set your Gravatar as your profile picture
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Profile details */}
          <div className="flex-1">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={user.name}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                  isEditing 
                    ? 'bg-white dark:bg-gray-700' 
                    : 'bg-gray-100 dark:bg-gray-800'
                } text-gray-900 dark:text-white`}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                  isEditing 
                    ? 'bg-white dark:bg-gray-700' 
                    : 'bg-gray-100 dark:bg-gray-800'
                } text-gray-900 dark:text-white`}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                  isEditing 
                    ? 'bg-white dark:bg-gray-700' 
                    : 'bg-gray-100 dark:bg-gray-800'
                } text-gray-900 dark:text-white`}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                  isEditing 
                    ? 'bg-white dark:bg-gray-700' 
                    : 'bg-gray-100 dark:bg-gray-800'
                } text-gray-900 dark:text-white`}
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center gap-2"
                >
                  <HiPencil className="w-5 h-5" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveProfile}
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
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(user.displayName || user.name || '');
                      setAvatarPreview(user.avatar || '');
                      setMessage({ type: '', text: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <HiX className="w-5 h-5" />
                    Cancel
                  </button>
                </>
              )}
              
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md flex items-center gap-2"
              >
                <HiKey className="w-5 h-5" />
                Reset Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 