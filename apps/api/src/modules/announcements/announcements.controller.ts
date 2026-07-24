import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { announcementsService } from './announcements.service';
import { createAnnouncementSchema, listAnnouncementsQuerySchema } from './announcements.schema';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const announcementsController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listAnnouncementsQuerySchema.parse(req.query);
    const { announcements, meta } = await announcementsService.list(query);
    sendSuccess(res, { announcements }, 200, meta);
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createAnnouncementSchema.parse(req.body);
    const announcement = await announcementsService.create(input, req.user!.id);
    sendSuccess(res, { announcement }, 201);
  },
};
