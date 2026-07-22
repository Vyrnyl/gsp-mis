import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { healthService } from './health.service';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const healthController = {
  async getHealth(_req: Request, res: Response): Promise<void> {
    const status = await healthService.getStatus();
    // 503 when a dependency is down, so orchestrators can act on the status code.
    sendSuccess(res, status, status.status === 'ok' ? 200 : 503);
  },
};
