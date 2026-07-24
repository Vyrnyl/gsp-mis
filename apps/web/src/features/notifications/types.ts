/** Mirrors the `Notification` Prisma model — personal, per-user, no category column. */
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO datetime
}
