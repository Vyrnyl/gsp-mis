import { listAllEvents } from '@/features/events/services/events.service';

import type { ActivityReportFormValues, ActivityReportSummary, ReportableEvent } from '../types';

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

export class ActivityReportsRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ActivityReportsRequestError';
  }
}

/** Calls this app's own `/api/activity-reports/*` BFF routes, never the Express API directly (code-standards.md §7.4). */
async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new ActivityReportsRequestError(
      json.error?.message ?? 'Something went wrong. Please try again.',
      json.error?.details,
    );
  }

  return { data: json.data, meta: json.meta };
}

export interface ListActivityReportsResult {
  activityReports: ActivityReportSummary[];
  totalItems: number;
}

export async function listActivityReports(
  params: { page?: number; pageSize?: number } = {},
): Promise<ListActivityReportsResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const search = query.toString();

  const { data, meta } = await request<{ activityReports: ActivityReportSummary[] }>(
    `/api/activity-reports${search ? `?${search}` : ''}`,
  );
  return { activityReports: data.activityReports, totalItems: meta?.totalItems ?? data.activityReports.length };
}

export async function getActivityReport(id: string): Promise<ActivityReportSummary> {
  const { data } = await request<{ activityReport: ActivityReportSummary }>(`/api/activity-reports/${id}`);
  return data.activityReport;
}

export async function createActivityReport(values: ActivityReportFormValues): Promise<ActivityReportSummary> {
  const { data } = await request<{ activityReport: ActivityReportSummary }>('/api/activity-reports', {
    method: 'POST',
    body: JSON.stringify({
      eventId: values.eventId,
      summary: values.summary,
      participationNotes: values.participationNotes || undefined,
      outcomes: values.outcomes || undefined,
    }),
  });
  return data.activityReport;
}

/** Reuses 2.1's events list rather than duplicating a lookup — only completed events can carry a report. */
export async function listReportableEvents(): Promise<ReportableEvent[]> {
  const events = await listAllEvents({ status: 'completed' });
  return events.map((event) => ({ id: event.id, title: event.title, eventDate: event.eventDate }));
}
