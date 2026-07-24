import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { changePasswordSchema, updateProfileSchema } from './profile.schema';
import { profileService } from './profile.service';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const profileController = {
  async getProfile(req: Request, res: Response): Promise<void> {
    const profile = await profileService.getProfile(req.user!.id);
    sendSuccess(res, profile);
  },

  async updateProfile(req: Request, res: Response): Promise<void> {
    const input = updateProfileSchema.parse(req.body);
    const profile = await profileService.updateProfile(req.user!.id, input);
    sendSuccess(res, profile);
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    const input = changePasswordSchema.parse(req.body);
    await profileService.changePassword(req.user!.id, input);
    sendSuccess(res, { changed: true });
  },
};
