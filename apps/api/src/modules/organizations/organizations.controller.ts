import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { organizationsService } from './organizations.service';

export const organizationsController = {
  async listTroops(_req: Request, res: Response): Promise<void> {
    const result = await organizationsService.listTroops();
    sendSuccess(res, result);
  },

  async listScoutLevels(_req: Request, res: Response): Promise<void> {
    const result = await organizationsService.listScoutLevels();
    sendSuccess(res, result);
  },
};
