import { useState, useEffect } from 'react';
import client from '../api/client';
import type { AdminStats, AdminUser, AdminProject, AdminTicket } from '../types';

type Tab = 'users' | 'projects' | 'tickets';

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);

  useEffect(() => {
    client.get('/admin/stats').then(({ data }) => setStats(data));
    client.get('/admin/users').then(({ data }) => setUsers(data));
    client.get('/admin/projects').then(({ data }) => setProjects(data));
    client.get('/admin/tickets').then(({ data }) => setTickets(data));
  }, []);

  const statCards = stats
    ? [
        { label: 'Users', value: stats.total_users, color: 'bg-blue-50 text-blue-700' },
        { label: 'Projects', value: stats.total_projects, color: 'bg-green-50 text-green-700' },
        { label: 'Tickets', value: stats.total_tickets, color: 'bg-purple-50 text-purple-700' },
        { label: 'API Calls', value: stats.total_api_calls, color: 'bg-orange-50 text-orange-700' },
      ]
    : [];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'projects', label: 'Projects' },
    { key: 'tickets', label: 'Tickets' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

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
      <div className="border-b border-gray-200 mb-4">
        <div className="flex gap-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-right">Projects</th>
                <th className="px-4 py-2 text-right">Tickets</th>
                <th className="px-4 py-2 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.display_name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === 'super_admin'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{u.project_count}</td>
                  <td className="px-4 py-2 text-right">{u.ticket_count}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Project</th>
                <th className="px-4 py-2 text-left">Owner</th>
                <th className="px-4 py-2 text-right">Tickets</th>
                <th className="px-4 py-2 text-right">API Usage</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2">{p.owner_email}</td>
                  <td className="px-4 py-2 text-right">{p.ticket_count}</td>
                  <td className="px-4 py-2 text-right">{p.usage_count}/1000</td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(p.created_at).toLocaleDateString()}
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Project</th>
                <th className="px-4 py-2 text-left">Owner</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2 font-medium">{t.title}</td>
                  <td className="px-4 py-2">{t.project_name}</td>
                  <td className="px-4 py-2">{t.owner_email}</td>
                  <td className="px-4 py-2">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        t.priority === 'high'
                          ? 'bg-red-50 text-red-700'
                          : t.priority === 'medium'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
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
