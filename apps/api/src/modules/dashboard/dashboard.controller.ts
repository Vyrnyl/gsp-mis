import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { dashboardService } from './dashboard.service';
import type { DashboardRole } from './dashboard.types';

/** Thin controller — `req.user` comes from `requireAuth`, never a query/body param. */
export const dashboardController = {
  async get(req: Request, res: Response): Promise<void> {
    const { id, role } = req.user!;
    const data = await dashboardService.getDashboard(id, role as DashboardRole);
    sendSuccess(res, data);
  },
};
