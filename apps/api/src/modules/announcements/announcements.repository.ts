import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';
import type { CreateAnnouncementInput, ListAnnouncementsQuery } from './announcements.schema';

const announcementInclude = { postedBy: true } satisfies Prisma.AnnouncementPostInclude;

export type AnnouncementWithRelations = Prisma.AnnouncementPostGetPayload<{
  include: typeof announcementInclude;
}>;

export const announcementsRepository = {
  async list(query: ListAnnouncementsQuery): Promise<{ rows: AnnouncementWithRelations[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.announcementPost.findMany({
        include: announcementInclude,
        orderBy: { postedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.announcementPost.count(),
    ]);
    return { rows, total };
  },

  create(input: CreateAnnouncementInput, postedById: string) {
    return prisma.announcementPost.create({
      data: {
        title: input.title.trim(),
        content: input.content.trim(),
        postedById,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
      include: announcementInclude,
    });
  },

  /** Fan-out recipients for the "new announcement" notification. */
  listAllUserIds() {
    return prisma.user.findMany({ select: { id: true } });
  },
};
