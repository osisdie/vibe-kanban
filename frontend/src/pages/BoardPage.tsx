import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import client from '../api/client';
import KanbanBoard from '../components/KanbanBoard';
import type { ApiKey } from '../types';

export default function BoardPage() {
  const { apiKeyId } = useParams<{ apiKeyId: string }>();
  const [project, setProject] = useState<ApiKey | null>(null);

  useEffect(() => {
    client.get('/api-keys').then(({ data }: { data: ApiKey[] }) => {
      const found = data.find((k: ApiKey) => k.id === Number(apiKeyId));
      setProject(found || null);
    });
  }, [apiKeyId]);

  if (!apiKeyId) return null;

  return (
    <div>
      <div className="px-4 pt-4 flex items-center gap-3">
        <Link to="/settings" className="text-gray-400 hover:text-gray-600">
          &larr; Projects
        </Link>
        {project && (
          <h2 className="text-lg font-semibold text-gray-800">{project.name}</h2>
        )}
      </div>
      <KanbanBoard apiKeyId={Number(apiKeyId)} />
    </div>
  );
}
