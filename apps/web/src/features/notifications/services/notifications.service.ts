import type { NotificationItem } from '../types';

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

export class NotificationsRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'NotificationsRequestError';
  }
}

/** Calls this app's own `/api/notifications/*` BFF routes, never the Express API directly (code-standards.md §7.4). */
async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new NotificationsRequestError(
      json.error?.message ?? 'Something went wrong. Please try again.',
      json.error?.details,
    );
  }

  return { data: json.data, meta: json.meta };
}

export interface ListNotificationsResult {
  notifications: NotificationItem[];
  unreadCount: number;
  totalItems: number;
}

export async function listNotifications(
  params: { page?: number; pageSize?: number } = {},
): Promise<ListNotificationsResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const search = query.toString();

  const { data, meta } = await request<{ notifications: NotificationItem[]; unreadCount: number }>(
    `/api/notifications${search ? `?${search}` : ''}`,
  );
  return {
    notifications: data.notifications,
    unreadCount: data.unreadCount,
    totalItems: meta?.totalItems ?? data.notifications.length,
  };
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  const { data } = await request<{ notification: NotificationItem }>(`/api/notifications/${id}/read`, {
    method: 'PATCH',
  });
  return data.notification;
}

export async function markAllNotificationsRead(): Promise<void> {
  await request<{ message: string }>('/api/notifications/read-all', { method: 'PATCH' });
}
