import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import {
  createUserSchema,
  listAuditLogsQuerySchema,
  listUsersQuerySchema,
  setUserStatusSchema,
  updateSystemSettingsSchema,
  updateUserSchema,
} from './settings.schema';
import { settingsService } from './settings.service';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const settingsController = {
  async getSettings(_req: Request, res: Response): Promise<void> {
    const settings = await settingsService.getSystemSettings();
    sendSuccess(res, settings);
  },

  async updateSettings(req: Request, res: Response): Promise<void> {
    const input = updateSystemSettingsSchema.parse(req.body);
    const settings = await settingsService.updateSystemSettings(input, req.user!.id);
    sendSuccess(res, settings);
  },

  async getBackupInfo(_req: Request, res: Response): Promise<void> {
    const info = await settingsService.getBackupInfo();
    sendSuccess(res, info);
  },

  async runBackup(req: Request, res: Response): Promise<void> {
    const info = await settingsService.runBackup(req.user!.id);
    sendSuccess(res, info, 201);
  },

  async listUsers(req: Request, res: Response): Promise<void> {
    const query = listUsersQuerySchema.parse(req.query);
    const result = await settingsService.listUsers(query);
    sendSuccess(res, { users: result.users }, 200, result.meta);
  },

  async createUser(req: Request, res: Response): Promise<void> {
    const input = createUserSchema.parse(req.body);
    const user = await settingsService.createUser(input, req.user!.id);
    sendSuccess(res, { user }, 201);
  },

  async updateUser(req: Request, res: Response): Promise<void> {
    const input = updateUserSchema.parse(req.body);
    const user = await settingsService.updateUser(req.params['id']!, input, req.user!.id);
    sendSuccess(res, { user });
  },

  async setUserStatus(req: Request, res: Response): Promise<void> {
    const input = setUserStatusSchema.parse(req.body);
    const user = await settingsService.setUserStatus(req.params['id']!, input, req.user!.id);
    sendSuccess(res, { user });
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    const temporaryPassword = await settingsService.resetPassword(req.params['id']!, req.user!.id);
    sendSuccess(res, { temporaryPassword });
  },

  async deleteUser(req: Request, res: Response): Promise<void> {
    await settingsService.deleteUser(req.params['id']!, req.user!.id);
    sendSuccess(res, { deleted: true });
  },

  async listAuditLogs(req: Request, res: Response): Promise<void> {
    const query = listAuditLogsQuerySchema.parse(req.query);
    const result = await settingsService.listAuditLogs(query);
    sendSuccess(res, { entries: result.entries }, 200, result.meta);
  },
};
