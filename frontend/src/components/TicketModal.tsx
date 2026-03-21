import { useState, useEffect, type FormEvent } from 'react';
import client from '../api/client';
import type { TicketStatus, TicketPriority, Comment } from '../types';

interface Props {
  ticketId: number | null;
  apiKeyId: number;
  onClose: () => void;
  onSaved: () => void;
  createInStatus?: TicketStatus;
}

export default function TicketModal({ ticketId, apiKeyId, onClose, onSaved, createInStatus }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [status, setStatus] = useState<TicketStatus>(createInStatus || 'todo');
  const [comments, setComments] = useState<Comment[]>([]);
  const [tag, setTag] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = ticketId !== null;

  useEffect(() => {
    if (isEdit) {
      client.get(`/tickets/${ticketId}`).then(({ data }: { data: { title: string; description: string; priority: TicketPriority; status: TicketStatus; tag?: string; comments: Comment[] } }) => {
        setTitle(data.title);
        setDescription(data.description || '');
        setPriority(data.priority);
        setStatus(data.status);
        setTag(data.tag || '');
        setComments(data.comments || []);
      });
    }
  }, [ticketId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await client.put(`/tickets/${ticketId}`, { title, description, priority, tag: tag || undefined });
      } else {
        await client.post(`/api-keys/${apiKeyId}/tickets`, {
          title,
          description: description || undefined,
          priority,
          status,
          tag: tag || undefined,
        });
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !isEdit) return;
    const { data }: { data: { comments: Comment[] } } = await client.post(`/tickets/${ticketId}/comments`, {
      content: newComment,
    });
    setComments(data.comments);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{isEdit ? 'Edit Ticket' : 'New Ticket'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              {!isEdit && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TicketStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="todo">TODO</option>
                    <option value="doing">Doing</option>
                    <option value="pending_confirming">Pending Confirming</option>
                    <option value="testing">Testing</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. v0.6.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </form>

          {isEdit && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Comments ({comments.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-lg text-sm ${
                      c.is_status_change
                        ? 'bg-gray-50 text-gray-500 italic'
                        : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">{c.author}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p>{c.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-gray-400 text-sm">No comments yet.</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && addComment()}
                />
                <button
                  onClick={addComment}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
