import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import type { ApiKey } from '../types';

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

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
      await client.post('/api-keys', { name: newName });
      setNewName('');
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

  const copyKey = (key: string, id: number) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Projects (API Keys)</h1>

      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Project name..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && createKey()}
        />
        <button
          onClick={createKey}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Project
        </button>
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

      <div className="space-y-3">
        {apiKeys.map((k) => (
          <div key={k.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Link
                  to={`/board/${k.id}`}
                  className="font-semibold text-blue-600 hover:underline text-lg"
                >
                  {k.name}
                </Link>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">
                  {k.usage_count}/1000 actions
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                  {k.key.slice(0, 12)}...
                </code>
                <button
                  onClick={() => copyKey(k.key, k.id)}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  {copiedId === k.id ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <button
              onClick={() => deleteKey(k.id)}
              className="text-sm text-red-500 hover:text-red-700 ml-4"
            >
              Delete
            </button>
          </div>
        ))}
        {apiKeys.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No projects yet. Create one to get started.
          </p>
        )}
      </div>
      <p className="mt-4 text-sm text-gray-400">
        Maximum 10 projects per account. Each project allows up to 1000 API actions.
      </p>
    </div>
  );
}
