import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { analyticsService } from './analytics.service';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const analyticsController = {
  async getOverview(_req: Request, res: Response): Promise<void> {
    const result = await analyticsService.getOverview();
    sendSuccess(res, result);
  },
};
