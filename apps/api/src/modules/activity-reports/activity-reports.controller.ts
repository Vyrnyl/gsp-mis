import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { activityReportsService } from './activity-reports.service';
import { createActivityReportSchema, listActivityReportsQuerySchema } from './activity-reports.schema';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const activityReportsController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listActivityReportsQuerySchema.parse(req.query);
    const { activityReports, meta } = await activityReportsService.list(query, req.user!);
    sendSuccess(res, { activityReports }, 200, meta);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const activityReport = await activityReportsService.getById(req.params['id']!);
    sendSuccess(res, { activityReport });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createActivityReportSchema.parse(req.body);
    const activityReport = await activityReportsService.create(input, req.user!.id);
    sendSuccess(res, { activityReport }, 201);
  },
};
