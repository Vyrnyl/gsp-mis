import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { authService } from './auth.service';
import { forgotPasswordSchema, loginSchema, logoutSchema, refreshSchema, signupSchema } from './auth.schema';

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

  async signup(req: Request, res: Response): Promise<void> {
    const input = signupSchema.parse(req.body);
    const result = await authService.signup(input);
    sendSuccess(res, result, 201);
  },

  async logout(req: Request, res: Response): Promise<void> {
    const input = logoutSchema.parse(req.body);
    const result = await authService.logout(input);
    sendSuccess(res, result);
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const input = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(input);
    sendSuccess(res, result);
  },

  /** Protected by `requireAuth` — `req.user` is guaranteed present (auth.routes.ts). */
  async me(req: Request, res: Response): Promise<void> {
    const result = await authService.getCurrentUser(req.user!.id);
    sendSuccess(res, result);
  },
};
