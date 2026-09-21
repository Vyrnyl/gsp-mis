import type { ReportFormat } from './reports.schema';

/** Report files are **not** stored. A download regenerates the document from the
 * parameters on the `reports` row (`reports.service.ts#getDownload`).
 *
 * There used to be `save`/`read` here writing into `apps/api/storage/reports`.
 * That works locally and silently fails in production: Render's filesystem is
 * ephemeral, so every generated file vanished on the next deploy or restart
 * while its database row kept offering it in the history list — the download
 * then threw a raw ENOENT. Regenerating needs no disk, so there is nothing to
 * lose. Do not reintroduce file storage without a persistent volume behind it. */
const EXTENSIONS: Record<ReportFormat, string> = { pdf: 'pdf', excel: 'xlsx' };
const MIME_TYPES: Record<ReportFormat, string> = {
  pdf: 'application/pdf',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export const reportsStorage = {
  mimeTypeFor(format: ReportFormat): string {
    return MIME_TYPES[format];
  },

  extensionFor(format: ReportFormat): string {
    return EXTENSIONS[format];
  },
};
