import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { authService } from './auth.service';
import { loginSchema, refreshSchema } from './auth.schema';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    sendSuccess(res, result);
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const input = refreshSchema.parse(req.body);
    const result = await authService.refresh(input);
    sendSuccess(res, result);
  },
};
