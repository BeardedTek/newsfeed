'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Label, TextInput, Button, Card, Spinner } from 'flowbite-react';

const CATEGORIES = [
  'US News',
  'World News',
  'Tech',
  'Politics',
  'Linux',
];

export default function PreferencesForm() {
  const { data: session, status } = useSession();
  const [prefs, setPrefs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/preferences')
        .then(res => res.json())
        .then(data => {
          const map: Record<string, string> = {};
          data.forEach((pref: any) => {
            map[pref.category] = pref.value;
          });
          setPrefs(map);
          setLoading(false);
        });
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [status]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await Promise.all(
      CATEGORIES.map(async (cat) => {
        await fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: cat, value: prefs[cat] || '' }),
        });
      })
    );
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  if (!session) return <div className="text-center mt-8">Please sign in to view your preferences.</div>;

  return (
    <Card>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <Label htmlFor={cat} value={cat} />
            <TextInput
              id={cat}
              value={prefs[cat] || ''}
              onChange={e => setPrefs({ ...prefs, [cat]: e.target.value })}
              placeholder={`Enter your preference for ${cat}`}
            />
          </div>
        ))}
        <Button type="submit" isProcessing={saving} disabled={saving}>
          Save Preferences
        </Button>
      </form>
    </Card>
  );
} 