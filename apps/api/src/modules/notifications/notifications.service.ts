import type { Notification } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { buildPaginationMeta, type PaginationMeta } from '../../shared/utils/api-response';
import { notificationsRepository } from './notifications.repository';
import type { ListNotificationsQuery } from './notifications.schema';
import type { NotificationDto } from './notifications.types';

function toDto(row: Notification): NotificationDto {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

export const notificationsService = {
  async list(
    userId: string,
    query: ListNotificationsQuery,
  ): Promise<{ notifications: NotificationDto[]; unreadCount: number; meta: PaginationMeta }> {
    const { rows, total, unreadCount } = await notificationsRepository.list(userId, query);
    return {
      notifications: rows.map(toDto),
      unreadCount,
      meta: buildPaginationMeta(query.page, query.pageSize, total),
    };
  },

  /** Scoped to the requester's own rows — a notification id alone is not proof of ownership. */
  async markRead(id: string, userId: string): Promise<NotificationDto> {
    const existing = await notificationsRepository.findById(id);
    if (!existing || existing.userId !== userId) throw ApiError.notFound('Notification not found.');

    const updated = await notificationsRepository.markRead(id);
    return toDto(updated);
  },

  async markAllRead(userId: string): Promise<void> {
    await notificationsRepository.markAllRead(userId);
  },
};
