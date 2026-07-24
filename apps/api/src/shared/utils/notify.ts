import { prisma } from '../../config/prisma';

export interface NotifyUserInput {
  userId: string;
  title: string;
  message: string;
}

/**
 * Best-effort: a failed notification write must never block the domain action it's
 * attached to (registration approval, badge verification, an announcement post), so
 * failures are swallowed here rather than propagated — same precedent as auth's
 * best-effort logout revoke.
 */
export async function notifyUser(input: NotifyUserInput): Promise<void> {
  try {
    await prisma.notification.create({ data: input });
  } catch {
    // Swallow — see doc comment above.
  }
}

/** Fan-out for announcements — one row per recipient, same non-blocking guarantee as `notifyUser`. */
export async function notifyUsers(userIds: string[], title: string, message: string): Promise<void> {
  if (userIds.length === 0) return;
  try {
    await prisma.notification.createMany({ data: userIds.map((userId) => ({ userId, title, message })) });
  } catch {
    // Swallow — see doc comment above.
  }
}
