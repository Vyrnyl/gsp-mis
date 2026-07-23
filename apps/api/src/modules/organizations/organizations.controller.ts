import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { organizationsService } from './organizations.service';
import {
  createCategorySchema,
  createCouncilSchema,
  createScoutLevelSchema,
  createTroopSchema,
  updateCategorySchema,
  updateCouncilSchema,
  updateScoutLevelSchema,
  updateTroopSchema,
} from './organizations.schema';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const organizationsController = {
  // Councils
  async listCouncils(_req: Request, res: Response): Promise<void> {
    const result = await organizationsService.listCouncils();
    sendSuccess(res, result);
  },
  async createCouncil(req: Request, res: Response): Promise<void> {
    const input = createCouncilSchema.parse(req.body);
    const council = await organizationsService.createCouncil(input);
    sendSuccess(res, { council }, 201);
  },
  async updateCouncil(req: Request, res: Response): Promise<void> {
    const input = updateCouncilSchema.parse(req.body);
    const council = await organizationsService.updateCouncil(req.params['id']!, input);
    sendSuccess(res, { council });
  },
  async deleteCouncil(req: Request, res: Response): Promise<void> {
    await organizationsService.deleteCouncil(req.params['id']!);
    sendSuccess(res, { deleted: true });
  },

  // Troops
  async listTroops(_req: Request, res: Response): Promise<void> {
    const result = await organizationsService.listTroops();
    sendSuccess(res, result);
  },
  async createTroop(req: Request, res: Response): Promise<void> {
    const input = createTroopSchema.parse(req.body);
    const troop = await organizationsService.createTroop(input);
    sendSuccess(res, { troop }, 201);
  },
  async updateTroop(req: Request, res: Response): Promise<void> {
    const input = updateTroopSchema.parse(req.body);
    const troop = await organizationsService.updateTroop(req.params['id']!, input);
    sendSuccess(res, { troop });
  },
  async deleteTroop(req: Request, res: Response): Promise<void> {
    await organizationsService.deleteTroop(req.params['id']!);
    sendSuccess(res, { deleted: true });
  },
  async listTroopLeaders(_req: Request, res: Response): Promise<void> {
    const result = await organizationsService.listTroopLeaders();
    sendSuccess(res, result);
  },

  // Scout Levels
  async listScoutLevels(_req: Request, res: Response): Promise<void> {
    const result = await organizationsService.listScoutLevels();
    sendSuccess(res, result);
  },
  async createScoutLevel(req: Request, res: Response): Promise<void> {
    const input = createScoutLevelSchema.parse(req.body);
    const scoutLevel = await organizationsService.createScoutLevel(input);
    sendSuccess(res, { scoutLevel }, 201);
  },
  async updateScoutLevel(req: Request, res: Response): Promise<void> {
    const input = updateScoutLevelSchema.parse(req.body);
    const scoutLevel = await organizationsService.updateScoutLevel(req.params['id']!, input);
    sendSuccess(res, { scoutLevel });
  },
  async deleteScoutLevel(req: Request, res: Response): Promise<void> {
    await organizationsService.deleteScoutLevel(req.params['id']!);
    sendSuccess(res, { deleted: true });
  },

  // Badge Categories
  async listBadgeCategories(_req: Request, res: Response): Promise<void> {
    const result = await organizationsService.listBadgeCategories();
    sendSuccess(res, result);
  },
  async createBadgeCategory(req: Request, res: Response): Promise<void> {
    const input = createCategorySchema.parse(req.body);
    const badgeCategory = await organizationsService.createBadgeCategory(input);
    sendSuccess(res, { badgeCategory }, 201);
  },
  async updateBadgeCategory(req: Request, res: Response): Promise<void> {
    const input = updateCategorySchema.parse(req.body);
    const badgeCategory = await organizationsService.updateBadgeCategory(req.params['id']!, input);
    sendSuccess(res, { badgeCategory });
  },
  async deleteBadgeCategory(req: Request, res: Response): Promise<void> {
    await organizationsService.deleteBadgeCategory(req.params['id']!);
    sendSuccess(res, { deleted: true });
  },

  // Activity Categories
  async listActivityCategories(_req: Request, res: Response): Promise<void> {
    const result = await organizationsService.listActivityCategories();
    sendSuccess(res, result);
  },
  async createActivityCategory(req: Request, res: Response): Promise<void> {
    const input = createCategorySchema.parse(req.body);
    const activityCategory = await organizationsService.createActivityCategory(input);
    sendSuccess(res, { activityCategory }, 201);
  },
  async updateActivityCategory(req: Request, res: Response): Promise<void> {
    const input = updateCategorySchema.parse(req.body);
    const activityCategory = await organizationsService.updateActivityCategory(req.params['id']!, input);
    sendSuccess(res, { activityCategory });
  },
  async deleteActivityCategory(req: Request, res: Response): Promise<void> {
    await organizationsService.deleteActivityCategory(req.params['id']!);
    sendSuccess(res, { deleted: true });
  },
};
