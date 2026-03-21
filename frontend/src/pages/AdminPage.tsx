import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import type { AdminStats, AdminUser, AdminProject, AdminTicket } from '../types';

type Tab = 'users' | 'projects' | 'tickets';

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);

  const fetchData = () => {
    client.get('/admin/stats').then(({ data }) => setStats(data));
    client.get('/admin/users').then(({ data }) => setUsers(data));
    client.get('/admin/projects').then(({ data }) => setProjects(data));
    client.get('/admin/tickets').then(({ data }) => setTickets(data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleSuspend = async (u: AdminUser) => {
    const action = u.is_active ? 'suspend' : 'unsuspend';
    if (u.is_active && !confirm(`Suspend user ${u.email}? They will lose access.`)) return;
    await client.patch(`/admin/users/${u.id}/${action}`);
    fetchData();
  };

  const revokeProject = async (id: number) => {
    if (!confirm('Revoke this API key?')) return;
    await client.patch(`/admin/api-keys/${id}/revoke`);
    fetchData();
  };

  const regenerateProject = async (id: number) => {
    if (!confirm('Regenerate this API key? Old key stops working, usage resets.')) return;
    await client.patch(`/admin/api-keys/${id}/regenerate`);
    fetchData();
  };

  const statCards = stats
    ? [
        { label: 'Users', value: stats.total_users, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
        { label: 'Projects', value: stats.total_projects, color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
        { label: 'Tickets', value: stats.total_tickets, color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
        { label: 'API Calls', value: stats.total_api_calls, color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
      ]
    : [];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'projects', label: 'Projects' },
    { key: 'tickets', label: 'Tickets' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" data-testid="admin-stats">
        {statCards.map((s) => (
          <div key={s.label} className={`p-4 rounded-lg ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm opacity-75">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex gap-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tables */}
      {tab === 'users' && (
        <div className="overflow-x-auto" data-testid="admin-users-table">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left dark:text-gray-300">Email</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Name</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Role</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Status</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Verified</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Login</th>
                <th className="px-4 py-2 text-right dark:text-gray-300">Projects</th>
                <th className="px-4 py-2 text-right dark:text-gray-300">Tickets</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Joined</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((u) => (
                <tr key={u.id} className="dark:text-gray-300">
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.display_name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === 'super_admin'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {u.is_active ? 'active' : 'suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.email_verified
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}
                    >
                      {u.email_verified ? 'yes' : 'no'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.login_channel === 'google'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {u.login_channel}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{u.project_count}</td>
                  <td className="px-4 py-2 text-right">{u.ticket_count}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleSuspend(u)}
                      disabled={currentUser?.id === u.id}
                      className={`text-xs px-2 py-1 rounded ${
                        currentUser?.id === u.id
                          ? 'text-gray-400 cursor-not-allowed'
                          : u.is_active
                            ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                            : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      {u.is_active ? 'Suspend' : 'Unsuspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'projects' && (
        <div className="overflow-x-auto" data-testid="admin-projects-table">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left dark:text-gray-300">Project</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Owner</th>
                <th className="px-4 py-2 text-right dark:text-gray-300">Tickets</th>
                <th className="px-4 py-2 text-right dark:text-gray-300">API Usage</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Status</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Created</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {projects.map((p) => (
                <tr key={p.id} className="dark:text-gray-300">
                  <td className="px-4 py-2">
                    <div className="font-medium">{p.name}</div>
                    {p.description && <div className="text-xs text-gray-400">{p.description}</div>}
                  </td>
                  <td className="px-4 py-2">{p.owner_email}</td>
                  <td className="px-4 py-2 text-right">{p.ticket_count}</td>
                  <td className="px-4 py-2 text-right">{p.usage_count}/1000</td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      {p.is_active && (
                        <button
                          onClick={() => revokeProject(p.id)}
                          className="text-xs text-orange-600 hover:text-orange-800 dark:text-orange-400"
                        >
                          Revoke
                        </button>
                      )}
                      <button
                        onClick={() => regenerateProject(p.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Regenerate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'tickets' && (
        <div className="overflow-x-auto" data-testid="admin-tickets-table">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left dark:text-gray-300">Title</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Project</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Owner</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Status</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Priority</th>
                <th className="px-4 py-2 text-left dark:text-gray-300">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tickets.map((t) => (
                <tr key={t.id} className="dark:text-gray-300">
                  <td className="px-4 py-2 font-medium">{t.title}</td>
                  <td className="px-4 py-2">{t.project_name}</td>
                  <td className="px-4 py-2">{t.owner_email}</td>
                  <td className="px-4 py-2">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        t.priority === 'high'
                          ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : t.priority === 'medium'
                            ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    {new Date(t.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
