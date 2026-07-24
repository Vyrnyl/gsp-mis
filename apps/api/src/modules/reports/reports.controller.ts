import type { Request, Response } from 'express';

import { buildPaginationMeta, sendSuccess } from '../../shared/utils/api-response';
import { exportSchema, listHistoryQuerySchema, previewQuerySchema } from './reports.schema';
import { reportsService } from './reports.service';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const reportsController = {
  async getPreview(req: Request, res: Response): Promise<void> {
    const query = previewQuerySchema.parse(req.query);
    const preview = await reportsService.getPreview(query, req.user!);
    sendSuccess(res, preview);
  },

  async listHistory(req: Request, res: Response): Promise<void> {
    const query = listHistoryQuerySchema.parse(req.query);
    const { reports, total } = await reportsService.listHistory(query, req.user!);
    sendSuccess(res, { reports }, 200, buildPaginationMeta(query.page, query.pageSize, total));
  },

  async exportReport(req: Request, res: Response): Promise<void> {
    const input = exportSchema.parse(req.body);
    const result = await reportsService.exportReport(input, req.user!);
    sendSuccess(res, result, 201);
  },

  // Binary file response — bypasses the JSON envelope by design, same as any
  // download endpoint would (there is no earlier precedent for this in the codebase).
  async download(req: Request, res: Response): Promise<void> {
    const { filename, mimeType, buffer, report } = await reportsService.getDownload(req.params['id']!, req.user!);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Report-Title', encodeURIComponent(report.title));
    res.send(buffer);
  },
};
