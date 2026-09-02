import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { overviewQuerySchema } from './analytics.schema';
import { analyticsService } from './analytics.service';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const analyticsController = {
  async getOverview(req: Request, res: Response): Promise<void> {
    const query = overviewQuerySchema.parse(req.query);
    const result = await analyticsService.getOverview(query);
    sendSuccess(res, result);
  },
};
