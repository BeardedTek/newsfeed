'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProfileForm from '@/components/ProfileForm';

function ProfileContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Profile updated successfully!
        </div>
      )}
      <ProfileForm />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
} 