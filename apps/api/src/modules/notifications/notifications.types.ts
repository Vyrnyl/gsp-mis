/** Mirrors the `Notification` Prisma model — personal, per-user, no category column. */
export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ListNotificationsResponseBody {
  notifications: NotificationDto[];
  unreadCount: number;
}

export interface NotificationResponseBody {
  notification: NotificationDto;
}
