import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { ApiKey } from '../types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchKeys = async () => {
    const { data } = await client.get('/api-keys');
    setApiKeys(data);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const createKey = async () => {
    if (!newName.trim()) return;
    setError('');
    try {
      await client.post('/api-keys', { name: newName, description: newDesc || undefined });
      setNewName('');
      setNewDesc('');
      fetchKeys();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || 'Failed to create key');
    }
  };

  const deleteKey = async (id: number) => {
    if (!confirm('Delete this project and all its tickets?')) return;
    await client.delete(`/api-keys/${id}`);
    fetchKeys();
  };

  const revokeKey = async (id: number) => {
    if (!confirm('Revoke this API key? It will no longer accept requests.')) return;
    await client.patch(`/api-keys/${id}/revoke`);
    fetchKeys();
  };

  const regenerateKey = async (id: number) => {
    if (!confirm('Regenerate this API key? The old key will stop working and usage will reset.')) return;
    const { data } = await client.patch(`/api-keys/${id}/regenerate`);
    setApiKeys((prev) => prev.map((k) => (k.id === id ? data : k)));
  };

  const saveEdit = async (id: number) => {
    await client.put(`/api-keys/${id}`, { name: editName, description: editDesc });
    setEditingId(null);
    fetchKeys();
  };

  const startEdit = (k: ApiKey) => {
    setEditingId(k.id);
    setEditName(k.name);
    setEditDesc(k.description || '');
  };

  const copyKey = (key: string, id: number) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Projects (API Keys)</h1>

      <div className="mb-6 space-y-2">
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && createKey()}
          />
          <button
            onClick={createKey}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Project
          </button>
        </div>
        <input
          type="text"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="Description (optional)..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
        />
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">{error}</div>}

      <div className="space-y-3">
        {apiKeys.map((k) => (
          <div key={k.id} className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border ${k.is_active ? 'border-gray-200 dark:border-gray-700' : 'border-red-200 dark:border-red-800 opacity-75'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {editingId === k.id ? (
                  <div className="space-y-2 mb-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description..."
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm w-full dark:bg-gray-700 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(k.id)} className="text-xs text-blue-600 hover:text-blue-800">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {k.is_active ? (
                      <Link
                        to={`/board/${k.id}`}
                        className="font-semibold text-blue-600 hover:underline text-lg"
                      >
                        {k.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-400 text-lg">{k.name}</span>
                    )}
                    {!k.is_active && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full">
                        Revoked
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                      {k.usage_count}/1000 actions
                    </span>
                    <button onClick={() => startEdit(k)} className="text-xs text-gray-400 hover:text-gray-600">Edit</button>
                  </div>
                )}
                {k.description && editingId !== k.id && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{k.description}</p>
                )}
                <div className="mt-2 w-64">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{k.usage_count} used</span>
                    <span>{1000 - k.usage_count} remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        k.usage_count >= 900 ? 'bg-red-500' : k.usage_count >= 700 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min((k.usage_count / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <code className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                    {k.key.slice(0, 12)}...
                  </code>
                  <button
                    onClick={() => copyKey(k.key, k.id)}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    {copiedId === k.id ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="mt-1 flex gap-3 text-xs text-gray-400">
                  <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                  <span>Last used: {k.last_used_at ? timeAgo(k.last_used_at) : 'Never'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 ml-4">
                {k.is_active && (
                  <button
                    onClick={() => revokeKey(k.id)}
                    className="text-xs text-orange-600 hover:text-orange-800 dark:text-orange-400"
                  >
                    Revoke
                  </button>
                )}
                <button
                  onClick={() => regenerateKey(k.id)}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Regenerate
                </button>
                <button
                  onClick={() => deleteKey(k.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {apiKeys.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No projects yet. Create one to get started.
          </p>
        )}
      </div>
      <p className="mt-4 text-sm text-gray-400">
        Maximum {user?.email_verified ? 10 : 1} projects per account. Each project allows up to 1000 API actions.
        {user && !user.email_verified && (
          <> <Link to="/verify-email" className="text-blue-500 hover:underline">Verify your email</Link> to unlock 10 projects.</>
        )}
      </p>
    </div>
  );
}
