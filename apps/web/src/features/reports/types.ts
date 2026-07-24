export type ViewState = 'idle' | 'loading' | 'error' | 'ready';
export type HistoryViewState = 'loading' | 'error' | 'ready';

export type ReportTypeId = 'membership' | 'attendance' | 'badge' | 'financial' | 'activity' | 'executive';

export type ReportFormat = 'pdf' | 'excel';

export interface ReportTypeDef {
  id: ReportTypeId;
  label: string;
  description: string;
}

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  /** Admin/Executive Council only — Troop Leader is implicitly scoped to their own troop. */
  troopId: string;
}

/** Pre-formatted server-side (or mock-side) so the preview panel stays generic across types. */
export interface ReportStatValue {
  label: string;
  value: string;
}

/** `GET /reports/preview` response. Columns/rows are generic so one table renderer covers all 6 types. */
export interface ReportPreview {
  reportType: ReportTypeId;
  generatedAt: string;
  rangeLabel: string;
  stats: ReportStatValue[];
  columns: string[];
  rows: string[][];
}

/** `GET /reports` row — a previously generated `Report`. */
export interface GeneratedReport {
  id: string;
  title: string;
  reportType: ReportTypeId;
  format: ReportFormat;
  generatedByName: string | null;
  generatedAt: string;
}
