import type { ExportFormat, GeneratedReport, ReportFilters, ReportPreview, ReportTypeId } from '../types';

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

export class ReportsRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ReportsRequestError';
  }
}

/** Calls this app's own `/api/reports/*` BFF routes, never the Express API directly (code-standards.md §7.4). */
async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new ReportsRequestError(json.error?.message ?? 'Something went wrong. Please try again.', json.error?.details);
  }

  return { data: json.data, meta: json.meta };
}

function buildFilterQuery(reportType: ReportTypeId, filters: ReportFilters): string {
  const query = new URLSearchParams({ reportType, dateFrom: filters.dateFrom, dateTo: filters.dateTo });
  if (filters.troopId && filters.troopId !== 'all') query.set('troopId', filters.troopId);
  return query.toString();
}

export async function getReportPreview(reportType: ReportTypeId, filters: ReportFilters): Promise<ReportPreview> {
  const { data } = await request<ReportPreview>(`/api/reports/preview?${buildFilterQuery(reportType, filters)}`);
  return data;
}

export interface ListReportHistoryResult {
  reports: GeneratedReport[];
  totalItems: number;
}

export async function listReportHistory(params: { page?: number; pageSize?: number } = {}): Promise<ListReportHistoryResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const search = query.toString();

  const { data, meta } = await request<{ reports: GeneratedReport[] }>(`/api/reports${search ? `?${search}` : ''}`);
  return { reports: data.reports, totalItems: meta?.totalItems ?? data.reports.length };
}

export async function exportReport(
  reportType: ReportTypeId,
  filters: ReportFilters,
  format: ExportFormat,
): Promise<GeneratedReport> {
  const { data } = await request<{ report: GeneratedReport }>('/api/reports/export', {
    method: 'POST',
    body: JSON.stringify({
      reportType,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      troopId: filters.troopId && filters.troopId !== 'all' ? filters.troopId : undefined,
      format,
    }),
  });
  return data.report;
}

/** Deletes every report in the history. Administrator-only, enforced by the API. */
export async function resetReportHistory(): Promise<{ deleted: number }> {
  const { data } = await request<{ deleted: number }>('/api/reports/reset', { method: 'DELETE' });
  return data;
}

/** Fetches the document, then hands the browser a blob to save.
 *
 * A plain anchor navigation would be simpler, but it renders whatever the server
 * returns — so a failed download replaced the page with raw error JSON instead of
 * reporting it. Fetching first lets the caller surface a real message; the
 * httpOnly cookie still rides along, since this is same-origin. */
export async function downloadReport(report: GeneratedReport): Promise<void> {
  const response = await fetch(`/api/reports/${report.id}/download`, { credentials: 'same-origin' });

  if (!response.ok) {
    const message = await response
      .json()
      .then((body: { error?: { message?: string } }) => body.error?.message)
      .catch(() => undefined);
    throw new Error(message ?? 'The report could not be downloaded. Please try again.');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filenameFromResponse(response, report);
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

/** The server names the file in `Content-Disposition`; fall back to the report's
 * own title so a proxied response stripping the header still saves sensibly. */
function filenameFromResponse(response: Response, report: GeneratedReport): string {
  const match = /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') ?? '');
  if (match?.[1]) return match[1];
  return `${report.title.replace(/[^a-z0-9]+/gi, '-')}.${report.format === 'pdf' ? 'pdf' : 'xlsx'}`;
}
