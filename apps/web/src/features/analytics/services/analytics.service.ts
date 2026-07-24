import type { AnalyticsSnapshot } from '../types';

interface RawEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

export class AnalyticsRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsRequestError';
  }
}

/** Calls this app's own `/api/analytics/*` BFF routes, never the Express API directly (code-standards.md §7.4). */
async function request<T>(path: string): Promise<T> {
  const response = await fetch(path);
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new AnalyticsRequestError(json.error?.message ?? 'Something went wrong. Please try again.');
  }

  return json.data;
}

export function getAnalyticsOverview(): Promise<AnalyticsSnapshot> {
  return request<AnalyticsSnapshot>('/api/analytics/overview');
}
