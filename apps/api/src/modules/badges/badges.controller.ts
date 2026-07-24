import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { badgesService } from './badges.service';
import { createAchievementSchema, createBadgeSchema, recordMemberBadgeSchema, updateBadgeSchema } from './badges.schema';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const badgesController = {
  // Badge catalog
  async listBadges(_req: Request, res: Response): Promise<void> {
    const result = await badgesService.listBadges();
    sendSuccess(res, result);
  },
  async createBadge(req: Request, res: Response): Promise<void> {
    const input = createBadgeSchema.parse(req.body);
    const badge = await badgesService.createBadge(input);
    sendSuccess(res, { badge }, 201);
  },
  async updateBadge(req: Request, res: Response): Promise<void> {
    const input = updateBadgeSchema.parse(req.body);
    const badge = await badgesService.updateBadge(req.params['id']!, input);
    sendSuccess(res, { badge });
  },
  async deleteBadge(req: Request, res: Response): Promise<void> {
    await badgesService.deleteBadge(req.params['id']!);
    sendSuccess(res, { deleted: true });
  },

  async listMemberOptions(req: Request, res: Response): Promise<void> {
    const result = await badgesService.listMemberOptions(req.user!);
    sendSuccess(res, result);
  },

  // Member progress
  async listMemberProgress(req: Request, res: Response): Promise<void> {
    const result = await badgesService.listMemberProgress(req.user!);
    sendSuccess(res, result);
  },
  async recordMemberBadge(req: Request, res: Response): Promise<void> {
    const input = recordMemberBadgeSchema.parse(req.body);
    const record = await badgesService.recordMemberBadge(input, req.user!);
    sendSuccess(res, { record }, 201);
  },
  async verifyMemberBadge(req: Request, res: Response): Promise<void> {
    const record = await badgesService.verifyMemberBadge(req.params['id']!, req.user!.id);
    sendSuccess(res, { record });
  },

  // Achievements
  async listAchievements(req: Request, res: Response): Promise<void> {
    const result = await badgesService.listAchievements(req.user!);
    sendSuccess(res, result);
  },
  async createAchievement(req: Request, res: Response): Promise<void> {
    const input = createAchievementSchema.parse(req.body);
    const achievement = await badgesService.createAchievement(input, req.user!);
    sendSuccess(res, { achievement }, 201);
  },
};
