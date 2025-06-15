"use client";
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Table, Button, Spinner, Modal, TextInput } from 'flowbite-react';
import { HiRefresh, HiTrash, HiDownload, HiPencil, HiExternalLink, HiRss, HiGlobe } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

const ADMIN_ROLES = ['admin', 'poweruser'];
function hasAdminRole(user: any) {
  return user.roles && user.roles.some((role: any) => ADMIN_ROLES.includes(role.name));
}

interface Source {
  id: string;
  title: string;
  'website-url': string;
  'feed-url': string;
}

export default function AdminSourcesPage() {
  const { user, loading } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [workerLoading, setWorkerLoading] = useState<string | null>(null);
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [editForm, setEditForm] = useState({ title: '', website: '', feedUrl: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  // Add state for stats and per-source counts
  const [stats, setStats] = useState<{
    newsfeed_article_count: number;
    last_refresh: string | null;
    sources: { [feedUrl: string]: { count: number } };
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const getJwt = () => {
    const casdoorUser = sessionStorage.getItem('casdoorUser');
    if (!casdoorUser) return null;
    try {
      return JSON.parse(casdoorUser).jwt;
    } catch {
      return null;
    }
  };

  const fetchSources = async () => {
    try {
      setSourcesLoading(true);
      const token = getJwt();
      if (!token) throw new Error('No authentication token found');
      const response = await fetch('/api/admin/sources/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch sources');
      const data = await response.json();
      setSources(data);
    } catch (error) {
      toast.error('Failed to load sources');
      setSourcesError('Failed to load sources');
    } finally {
      setSourcesLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const token = getJwt();
      if (!token) throw new Error('No authentication token found');
      const response = await fetch('/api/admin/sources/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
    fetchStats();
  }, []);

  const handleRefresh = async (id: string) => {
    try {
      setActionLoading(`refresh-${id}`);
      const token = getJwt();
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`/api/admin/sources/${encodeURIComponent(id)}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to refresh feed');
      toast.success('Feed refreshed successfully');
      fetchSources(); // Refresh the list
    } catch (error) {
      toast.error('Failed to refresh feed');
      setSourcesError('Failed to refresh feed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClear = async (title: string) => {
    setActionLoading(`clear-${title}`);
    setSourcesError(null);
    try {
      const token = getJwt();
      if (!token) throw new Error('No authentication token found');
      const res = await fetch(`/api/admin/sources/${encodeURIComponent(title)}/clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to clear cache');
    } catch (err: any) {
      setSourcesError(err.message || 'Error clearing cache');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async (id: string) => {
    try {
      setActionLoading(`export-${id}`);
      const token = getJwt();
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`/api/admin/sources/export/${encodeURIComponent(id)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to export feed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}.opml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Feed exported successfully');
    } catch (error) {
      toast.error('Failed to export feed');
      setSourcesError('Failed to export feed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportAll = async () => {
    try {
      setActionLoading('export-all');
      const token = getJwt();
      if (!token) throw new Error('No authentication token found');
      const response = await fetch('/api/admin/sources/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to export feeds');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'freshrss_feeds.opml';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('All feeds exported successfully');
    } catch (error) {
      toast.error('Failed to export feeds');
      setSourcesError('Failed to export feeds');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (source: any) => {
    setEditingSource(source);
    setEditForm({
      title: source.title || '',
      website: source['website-url'] || '',
      feedUrl: source['feed-url'] || '',
    });
    setShowEditModal(true);
    setEditError(null);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingSource(null);
    setEditError(null);
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError(null);
    try {
      // TODO: Implement backend update endpoint and call it here
      // Example:
      const token = getJwt();
      if (!token) throw new Error('No authentication token found');
      // await fetch(`/api/admin/sources/${encodeURIComponent(editingSource.title)}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
      closeEditModal();
      // Optionally refresh sources
    } catch (err: any) {
      setEditError(err.message || 'Error updating source');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleProcessArticles = async () => {
    try {
      setWorkerLoading('process');
      const token = getJwt();
      if (!token) throw new Error('No authentication token found');
      const response = await fetch('/api/admin/workers/process-articles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to trigger article processing');
      toast.success('Article processing started');
    } catch (error) {
      toast.error('Failed to trigger article processing');
      setSourcesError('Failed to trigger article processing');
    } finally {
      setWorkerLoading(null);
    }
  };

  const handlePurgeArticles = async () => {
    try {
      setWorkerLoading('purge');
      const token = getJwt();
      if (!token) throw new Error('No authentication token found');
      const response = await fetch('/api/admin/workers/purge-articles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to trigger article purge');
      toast.success('Article purge started');
    } catch (error) {
      toast.error('Failed to trigger article purge');
      setSourcesError('Failed to trigger article purge');
    } finally {
      setWorkerLoading(null);
    }
  };

  const handleEnrichArticles = async () => {
    try {
      setWorkerLoading('enrich');
      const token = getJwt();
      if (!token) throw new Error('No authentication token found');
      const response = await fetch('/api/admin/workers/enrich-articles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to trigger article enrichment');
      toast.success('Article enrichment started');
    } catch (error) {
      toast.error('Failed to trigger article enrichment');
      setSourcesError('Failed to trigger article enrichment');
    } finally {
      setWorkerLoading(null);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <div className="max-w-2xl mx-auto mt-16 p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md text-center">Admin Login Required</div>;
  if (!hasAdminRole(user)) return <div className="max-w-2xl mx-auto mt-16 p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md text-center">Access Denied</div>;

  return (
    <div className="w-full mx-auto mt-12 p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900 dark:text-white">Sources</h1>
      <p className="mb-8 text-lg text-gray-700 dark:text-gray-300">
        Manage news sources and feeds. Uses FreshRSS's API to manage subscriptions.
      </p>
      <div className="mb-6 p-4 rounded shadow overflow-x-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 items-center gap-2 bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <div>
            <Button
            color="blue"
            onClick={handleExportAll}
            disabled={sourcesLoading}
            className="w-full"
            title="Export all sources as OPML"
          >
            <HiDownload className="mr-2 h-5 w-5" />
            Export
          </Button>
          </div>
          <div>
            <Button
            color="green"
            onClick={handleProcessArticles}
            disabled={workerLoading === 'process'}
            className="w-full"
            title="Process New Articles Now"
          >
            {workerLoading === 'process' ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <HiRefresh className="mr-2 h-5 w-5" />
            )}
            Process
          </Button>
          </div>
          <div>
            <Button
            color="green"
            onClick={handleEnrichArticles}
            disabled={workerLoading === 'enrich'}
            className="w-full"
            title="Enrich Articles Now"
          >
            {workerLoading === 'enrich' ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <HiRefresh className="mr-2 h-5 w-5" />
            )}
            Enrich
          </Button>
          </div>
          <div>
            <Button
            color="red"
            onClick={handlePurgeArticles}
            disabled={workerLoading === 'purge'}
            className="w-full"
            title="Purge Old Articles Now"
          >
            {workerLoading === 'purge' ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <HiTrash className="mr-2 h-5 w-5" />
            )}
            Purge
          </Button>
          </div>
        </div>
      </div>

      {/* Insert stats display after the export/process/purge buttons and before the sources list: */}
      {statsLoading ? (
        <div className="mb-4"><Spinner /></div>
      ) : stats ? (
        <div className="mb-4 flex flex-wrap gap-6 items-center justify-center text-lg">
          <div>Total NewsFeed Articles: <span className="font-bold">{stats.newsfeed_article_count}</span></div>
          <div>Last Refresh: <span className="font-bold">{stats.last_refresh ? new Date(stats.last_refresh).toLocaleString() : 'Never'}</span></div>
        </div>
      ) : null}

      <div className="mb-2 p-2 rounded shadow overflow-x-auto">
        {sourcesLoading ? (
          <Spinner />
        ) : sourcesError ? (
          <div className="text-red-500">{sourcesError}</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sources.map((s) => (
              <div key={s.title} className="grid grid-cols-1 md:grid-cols-2 items-center gap-2 bg-white dark:bg-gray-900 rounded-lg shadow pb-1">
                <div className="flex flex-wrap gap-2 md:justify-start">
                  <Button size="xs" onClick={() => openEditModal(s)} title="Edit source"
                    color="info" type="button" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                    <HiPencil />
                  </Button>
                  <p>{s.title}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-start">
                  <a href={s['website-url']} target="_blank" rel="noopener noreferrer" title="Website">
                    <Button size="xs" color="light" type="button" className="hover:bg-gray-200 dark:hover:bg-gray-700"><HiGlobe /></Button>
                  </a>
                  <a href={s['feed-url']} target="_blank" rel="noopener noreferrer" title="RSS Feed">
                    <Button size="xs" color="light" type="button" className="hover:bg-gray-200 dark:hover:bg-gray-700"><HiRss /></Button>
                  </a>
                  <Button size="xs" color="green" onClick={() => handleRefresh(s.id)} disabled={actionLoading === `refresh-${s.id}`}
                    title="Refresh feed" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                    {actionLoading === `refresh-${s.id}` ? <Spinner size="sm" /> : <HiRefresh />}
                  </Button>
                  <Button size="xs" color="blue" onClick={() => handleExport(s.id)} title="Export as OPML"><HiDownload /></Button>
                  <Button
                    size="xs"
                    color="light"
                    type="button"
                    disabled
                    title={
                      stats && stats.sources[s['feed-url']] && stats.last_refresh
                        ? `Last refreshed on ${new Date(stats.last_refresh).toLocaleString()}`
                        : 'Never'
                    }
                    className="hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    {stats && stats.sources[s['feed-url']] !== undefined ? stats.sources[s['feed-url']].count : <Spinner size="sm" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal show={showEditModal} onClose={closeEditModal} size="md">
        <Modal.Header>Edit Source</Modal.Header>
        <Modal.Body>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <TextInput id="edit-title" name="title" value={editForm.title} onChange={handleEditChange} required />
            <label htmlFor="edit-website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
            <TextInput id="edit-website" name="website" value={editForm.website} onChange={handleEditChange} />
            <label htmlFor="edit-feedUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Feed URL</label>
            <TextInput id="edit-feedUrl" name="feedUrl" value={editForm.feedUrl} onChange={handleEditChange} />
            {editError && <div className="text-red-500">{editError}</div>}
            <div className="flex justify-end">
              <Button color="blue" type="submit" disabled={editSubmitting}>
                {editSubmitting ? <Spinner size="sm" /> : 'Save Changes'}
              </Button>
              <Button color="gray" onClick={closeEditModal} disabled={editSubmitting} className="ml-2">Cancel</Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Advanced Grouping & Filtering</h2>
        <div className="text-gray-500 dark:text-gray-400 italic">TODO: Group sources, search, and filter. Suggest additional filtering techniques.</div>
      </div>
    </div>
  );
}