import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';
import type { CreateActivityReportInput, ListActivityReportsQuery } from './activity-reports.schema';

const activityReportInclude = {
  event: true,
  submittedBy: { include: { ledTroops: true } },
} satisfies Prisma.ActivityReportInclude;

export type ActivityReportWithRelations = Prisma.ActivityReportGetPayload<{
  include: typeof activityReportInclude;
}>;

export const activityReportsRepository = {
  async list(
    query: ListActivityReportsQuery,
    where: Prisma.ActivityReportWhereInput,
  ): Promise<{ rows: ActivityReportWithRelations[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.activityReport.findMany({
        where,
        include: activityReportInclude,
        orderBy: { submittedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.activityReport.count({ where }),
    ]);
    return { rows, total };
  },

  findById(id: string) {
    return prisma.activityReport.findUnique({ where: { id }, include: activityReportInclude });
  },

  findEventById(id: string) {
    return prisma.event.findUnique({ where: { id } });
  },

  create(input: CreateActivityReportInput, submittedById: string) {
    return prisma.activityReport.create({
      data: {
        eventId: input.eventId,
        submittedById,
        summary: input.summary.trim(),
        participationNotes: input.participationNotes?.trim() || null,
        outcomes: input.outcomes?.trim() || null,
      },
      include: activityReportInclude,
    });
  },
};
