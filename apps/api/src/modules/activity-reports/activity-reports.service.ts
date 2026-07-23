import type { Prisma } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { buildPaginationMeta, type PaginationMeta } from '../../shared/utils/api-response';
import type { RoleName } from '../../shared/constants/roles';
import type { ActivityReportWithRelations } from './activity-reports.repository';
import { activityReportsRepository } from './activity-reports.repository';
import type { CreateActivityReportInput, ListActivityReportsQuery } from './activity-reports.schema';
import type { ActivityReportSummary } from './activity-reports.types';

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function toSummary(report: ActivityReportWithRelations): ActivityReportSummary {
  return {
    id: report.id,
    event: {
      id: report.event.id,
      title: report.event.title,
      eventDate: report.event.eventDate.toISOString().slice(0, 10),
    },
    submittedBy: { id: report.submittedBy.id, fullName: report.submittedBy.fullName },
    troopName: report.submittedBy.ledTroops[0]?.name ?? null,
    summary: report.summary,
    participationNotes: report.participationNotes,
    outcomes: report.outcomes,
    status: report.status,
    submittedAt: report.submittedAt.toISOString(),
  };
}

export const activityReportsService = {
  /**
   * Troop Leader sees only their own submissions; Admin/Executive Council see every
   * troop's (build-plan.md "Council-visible list" — Executive Council's `read` grant
   * and Admin's blanket access both resolve to "see all" here).
   */
  async list(
    query: ListActivityReportsQuery,
    requestingUser: { id: string; role: RoleName },
  ): Promise<{ activityReports: ActivityReportSummary[]; meta: PaginationMeta }> {
    const where: Prisma.ActivityReportWhereInput =
      requestingUser.role === 'troop_leader' ? { submittedById: requestingUser.id } : {};
    const { rows, total } = await activityReportsRepository.list(query, where);
    return {
      activityReports: rows.map(toSummary),
      meta: buildPaginationMeta(query.page, query.pageSize, total),
    };
  },

  async getById(id: string): Promise<ActivityReportSummary> {
    const report = await activityReportsRepository.findById(id);
    if (!report) throw ApiError.notFound('Activity report not found.');
    return toSummary(report);
  },

  async create(input: CreateActivityReportInput, submittedById: string): Promise<ActivityReportSummary> {
    const event = await activityReportsRepository.findEventById(input.eventId);
    if (!event) throw ApiError.badRequest('Selected event does not exist.');
    if (event.eventDate >= startOfToday()) {
      throw ApiError.badRequest('You can only submit a report for a completed event.');
    }

    const created = await activityReportsRepository.create(input, submittedById);
    return toSummary(created);
  },
};
