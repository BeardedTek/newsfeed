'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Label, TextInput, Button, Card, Spinner } from 'flowbite-react';

export default function ProfileForm() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          setName(data.name || '');
          setImage(data.image || '');
          setLoading(false);
        });
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [status]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, image }),
    });
    const data = await res.json();
    setProfile(data);
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  if (!session) return <div className="text-center mt-8">Please sign in to view your profile.</div>;

  return (
    <Card>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email" value="Email" />
          <TextInput id="email" value={profile?.email || ''} readOnly disabled />
        </div>
        <div>
          <Label htmlFor="name" value="Name" />
          <TextInput id="name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="image" value="Profile Image URL" />
          <TextInput id="image" value={image} onChange={e => setImage(e.target.value)} />
        </div>
        <Button type="submit" isProcessing={saving} disabled={saving}>
          Save
        </Button>
      </form>
      {image && (
        <div className="flex justify-center mt-4">
          <img src={image} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
        </div>
      )}
    </Card>
  );
} 