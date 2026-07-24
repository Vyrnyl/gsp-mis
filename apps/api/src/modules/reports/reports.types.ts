import type { ReportFormat, ReportType } from './reports.schema';

export interface ReportStatValueDto {
  label: string;
  value: string;
}

/** `GET /reports/preview` response. Columns/rows are generic across all 6 types. */
export interface ReportPreviewDto {
  reportType: ReportType;
  generatedAt: string;
  rangeLabel: string;
  stats: ReportStatValueDto[];
  columns: string[];
  rows: string[][];
}

/** `GET /reports` row — a previously exported `Report`. */
export interface GeneratedReportDto {
  id: string;
  title: string;
  reportType: ReportType;
  format: ReportFormat;
  generatedByName: string | null;
  generatedAt: string;
}

export interface ExportResultDto {
  report: GeneratedReportDto;
  downloadUrl: string;
}
