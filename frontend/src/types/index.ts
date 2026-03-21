export interface User {
  id: number;
  email: string;
  display_name: string;
  avatar_url?: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  password_changed_at?: string;
  created_at?: string;
}

export interface AdminStats {
  total_users: number;
  total_projects: number;
  total_tickets: number;
  total_api_calls: number;
}

export interface AdminUser {
  id: number;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  login_channel: string;
  created_at: string;
  project_count: number;
  ticket_count: number;
}

export interface AdminProject {
  id: number;
  name: string;
  description?: string;
  owner_email: string;
  owner_name: string;
  usage_count: number;
  ticket_count: number;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
}

export interface AdminTicket {
  id: number;
  title: string;
  status: string;
  priority: string;
  project_name: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: number;
  name: string;
  description?: string;
  key: string;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
}

export type TicketStatus = 'todo' | 'doing' | 'pending_confirming' | 'testing' | 'done';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface Comment {
  id: number;
  author: string;
  content: string;
  is_status_change: boolean;
  created_at: string;
}

export interface Ticket {
  id: number;
  api_key_id: number;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  order: number;
  external_ref?: string;
  tag?: string;
  created_at: string;
  updated_at: string;
  comments: Comment[];
}

export interface TicketBrief {
  id: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  order: number;
  external_ref?: string;
  tag?: string;
  created_at: string;
  updated_at: string;
}

export const COLUMNS: { key: TicketStatus; label: string; color: string }[] = [
  { key: 'todo', label: 'TODO', color: 'bg-gray-100' },
  { key: 'doing', label: 'Doing', color: 'bg-blue-50' },
  { key: 'pending_confirming', label: 'Pending Confirming', color: 'bg-yellow-50' },
  { key: 'testing', label: 'Testing', color: 'bg-purple-50' },
  { key: 'done', label: 'Done', color: 'bg-green-50' },
];
