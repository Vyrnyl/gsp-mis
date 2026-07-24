import { beforeEach, describe, expect, it, vi } from 'vitest';

import { notificationsRepository } from '../src/modules/notifications/notifications.repository';
import { notificationsService } from '../src/modules/notifications/notifications.service';
import type { ListNotificationsQuery } from '../src/modules/notifications/notifications.schema';

const QUERY: ListNotificationsQuery = { page: 1, pageSize: 10 };

const NOTIFICATION_ROW = {
  id: 'notif-1',
  userId: 'user-liza',
  title: 'Registration approved',
  message: "Andrea Villareal's registration was approved.",
  isRead: false,
  createdAt: new Date('2026-07-06T14:30:00.000Z'),
};

describe('notificationsService', () => {
  beforeEach(() => vi.restoreAllMocks());

  describe('list', () => {
    it('scopes the list to the requesting user and builds pagination meta', async () => {
      const listSpy = vi
        .spyOn(notificationsRepository, 'list')
        .mockResolvedValue({ rows: [NOTIFICATION_ROW], total: 1, unreadCount: 1 });

      const result = await notificationsService.list('user-liza', QUERY);

      expect(listSpy).toHaveBeenCalledWith('user-liza', QUERY);
      expect(result.unreadCount).toBe(1);
      expect(result.notifications[0]).toMatchObject({ id: 'notif-1', title: 'Registration approved' });
      expect(result.meta).toMatchObject({ page: 1, pageSize: 10, totalItems: 1 });
    });
  });

  describe('markRead', () => {
    it('rejects an unknown notification with 404', async () => {
      vi.spyOn(notificationsRepository, 'findById').mockResolvedValue(null);

      await expect(notificationsService.markRead('missing', 'user-liza')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("rejects marking another user's notification with 404", async () => {
      vi.spyOn(notificationsRepository, 'findById').mockResolvedValue(NOTIFICATION_ROW);

      await expect(notificationsService.markRead('notif-1', 'user-someone-else')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('marks an owned notification as read', async () => {
      vi.spyOn(notificationsRepository, 'findById').mockResolvedValue(NOTIFICATION_ROW);
      const markReadSpy = vi
        .spyOn(notificationsRepository, 'markRead')
        .mockResolvedValue({ ...NOTIFICATION_ROW, isRead: true });

      const result = await notificationsService.markRead('notif-1', 'user-liza');

      expect(markReadSpy).toHaveBeenCalledWith('notif-1');
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllRead', () => {
    it('marks every unread notification for the requesting user', async () => {
      const markAllReadSpy = vi
        .spyOn(notificationsRepository, 'markAllRead')
        .mockResolvedValue({ count: 3 });

      await notificationsService.markAllRead('user-liza');

      expect(markAllReadSpy).toHaveBeenCalledWith('user-liza');
    });
  });
});
