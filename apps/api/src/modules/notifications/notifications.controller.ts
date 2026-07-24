import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { listNotificationsQuerySchema } from './notifications.schema';
import { notificationsService } from './notifications.service';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const notificationsController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listNotificationsQuerySchema.parse(req.query);
    const { notifications, unreadCount, meta } = await notificationsService.list(req.user!.id, query);
    sendSuccess(res, { notifications, unreadCount }, 200, meta);
  },

  async markRead(req: Request, res: Response): Promise<void> {
    const notification = await notificationsService.markRead(req.params['id']!, req.user!.id);
    sendSuccess(res, { notification });
  },

  async markAllRead(req: Request, res: Response): Promise<void> {
    await notificationsService.markAllRead(req.user!.id);
    sendSuccess(res, { message: 'All notifications marked as read.' });
  },
};
