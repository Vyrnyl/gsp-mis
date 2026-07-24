import type { AnnouncementFormValues, AnnouncementPost } from '../types';

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

export class AnnouncementsRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AnnouncementsRequestError';
  }
}

/** Calls this app's own `/api/announcements/*` BFF routes, never the Express API directly (code-standards.md §7.4). */
async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new AnnouncementsRequestError(
      json.error?.message ?? 'Something went wrong. Please try again.',
      json.error?.details,
    );
  }

  return { data: json.data, meta: json.meta };
}

export interface ListAnnouncementsResult {
  announcements: AnnouncementPost[];
  totalItems: number;
}

export async function listAnnouncements(
  params: { page?: number; pageSize?: number } = {},
): Promise<ListAnnouncementsResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const search = query.toString();

  const { data, meta } = await request<{ announcements: AnnouncementPost[] }>(
    `/api/announcements${search ? `?${search}` : ''}`,
  );
  return { announcements: data.announcements, totalItems: meta?.totalItems ?? data.announcements.length };
}

export async function createAnnouncement(values: AnnouncementFormValues): Promise<AnnouncementPost> {
  const { data } = await request<{ announcement: AnnouncementPost }>('/api/announcements', {
    method: 'POST',
    body: JSON.stringify({
      title: values.title,
      content: values.content,
      expiresAt: values.expiresAt || undefined,
    }),
  });
  return data.announcement;
}
