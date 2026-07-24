import type {
  AuditLogEntry,
  BackupInfo,
  CreateUserFormValues,
  PortalUserSummary,
  SystemSettingsFormValues,
  UserFilter,
  UserFormValues,
} from '../types';

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface RawEnvelope<T> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

interface ApiSuccess<T> {
  data: T;
  meta?: PaginationMeta;
}

export class SettingsRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'SettingsRequestError';
  }
}

/** Calls this app's own `/api/settings|users|audit-logs` BFF routes, never the Express API directly (code-standards.md §7.4). */
async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new SettingsRequestError(json.error?.message ?? 'Something went wrong. Please try again.', json.error?.details);
  }

  return { data: json.data, meta: json.meta };
}

// System settings
export async function getSystemSettings(): Promise<SystemSettingsFormValues> {
  const { data } = await request<SystemSettingsFormValues>('/api/settings');
  return data;
}

export async function updateSystemSettings(values: SystemSettingsFormValues): Promise<SystemSettingsFormValues> {
  const { data } = await request<SystemSettingsFormValues>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(values),
  });
  return data;
}

// Backups
export async function getBackupInfo(): Promise<BackupInfo> {
  const { data } = await request<BackupInfo>('/api/settings/backup');
  return data;
}

export async function runBackup(): Promise<BackupInfo> {
  const { data } = await request<BackupInfo>('/api/settings/backup', { method: 'POST' });
  return data;
}

// Users
export interface ListUsersParams {
  search?: string;
  role?: UserFilter;
  page?: number;
  pageSize?: number;
}

export interface ListResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
}

function buildUsersQuery(params: ListUsersParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.role && params.role !== 'all') query.set('role', params.role);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const search = query.toString();
  return search ? `?${search}` : '';
}

export async function listUsers(params: ListUsersParams): Promise<ListResult<PortalUserSummary>> {
  const { data, meta } = await request<{ users: PortalUserSummary[] }>(`/api/users${buildUsersQuery(params)}`);
  return { items: data.users, totalItems: meta?.totalItems ?? data.users.length, totalPages: meta?.totalPages ?? 1 };
}

export async function createUser(values: CreateUserFormValues): Promise<PortalUserSummary> {
  const { data } = await request<{ user: PortalUserSummary }>('/api/users', {
    method: 'POST',
    body: JSON.stringify(values),
  });
  return data.user;
}

export async function updateUser(id: string, values: UserFormValues): Promise<PortalUserSummary> {
  const { data } = await request<{ user: PortalUserSummary }>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
  });
  return data.user;
}

export async function setUserStatus(id: string, isActive: boolean): Promise<PortalUserSummary> {
  const { data } = await request<{ user: PortalUserSummary }>(`/api/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  return data.user;
}

export async function resetUserPassword(id: string): Promise<string> {
  const { data } = await request<{ temporaryPassword: string }>(`/api/users/${id}/reset-password`, { method: 'POST' });
  return data.temporaryPassword;
}

export async function deleteUser(id: string): Promise<void> {
  await request<{ deleted: true }>(`/api/users/${id}`, { method: 'DELETE' });
}

// Audit log
export interface ListAuditLogParams {
  search?: string;
  entityType?: string;
  page?: number;
  pageSize?: number;
}

function buildAuditLogQuery(params: ListAuditLogParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.entityType && params.entityType !== 'all') query.set('entityType', params.entityType);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const search = query.toString();
  return search ? `?${search}` : '';
}

export async function listAuditLogs(params: ListAuditLogParams): Promise<ListResult<AuditLogEntry>> {
  const { data, meta } = await request<{ entries: AuditLogEntry[] }>(`/api/audit-logs${buildAuditLogQuery(params)}`);
  return { items: data.entries, totalItems: meta?.totalItems ?? data.entries.length, totalPages: meta?.totalPages ?? 1 };
}
