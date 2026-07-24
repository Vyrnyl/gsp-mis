import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';

export const reportsRepository = {
  findTroopIdsLedBy(userId: string) {
    return prisma.troop.findMany({ where: { leaderId: userId }, select: { id: true } });
  },

  // Membership — unscoped by troop for reads (same precedent as the members module
  // itself, which has no troop-leader filtering on `GET /members`).
  listMembersInRange(dateFrom: Date, dateTo: Date, troopId: string | undefined) {
    return prisma.member.findMany({
      where: { createdAt: { gte: dateFrom, lte: dateTo }, ...(troopId ? { troopId } : {}) },
      include: { troop: true, status: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Attendance — one row per event in range; `troopIds` (Troop Leader only) restricts
  // which attendance records count toward that event's present/absent tally.
  listEventsWithAttendanceInRange(dateFrom: Date, dateTo: Date, troopIds: string[] | undefined) {
    const memberFilter: Prisma.AttendanceRecordWhereInput = troopIds
      ? { member: { troopId: { in: troopIds } } }
      : {};
    return prisma.event.findMany({
      where: { eventDate: { gte: dateFrom, lte: dateTo } },
      include: { attendanceRecords: { where: memberFilter } },
      orderBy: { eventDate: 'asc' },
    });
  },

  // Badges — earned/verified records within range (`earnedAt` is null for records
  // still `in_progress`, so those can't be date-filtered; counted separately below).
  listEarnedBadgesInRange(dateFrom: Date, dateTo: Date, troopIds: string[] | undefined, troopId: string | undefined) {
    return prisma.memberBadge.findMany({
      where: {
        earnedAt: { gte: dateFrom, lte: dateTo },
        status: { in: ['earned', 'verified'] },
        ...(troopIds ? { member: { troopId: { in: troopIds } } } : troopId ? { member: { troopId } } : {}),
      },
      include: { member: { include: { troop: true } }, badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  },

  countInProgressBadges(troopIds: string[] | undefined, troopId: string | undefined) {
    return prisma.memberBadge.count({
      where: {
        status: 'in_progress',
        ...(troopIds ? { member: { troopId: { in: troopIds } } } : troopId ? { member: { troopId } } : {}),
      },
    });
  },

  // Activity reports — `submittedById` scopes Troop Leader to their own submissions,
  // same rule the activity-reports module itself enforces.
  listActivityReportsInRange(dateFrom: Date, dateTo: Date, submittedById: string | undefined) {
    return prisma.activityReport.findMany({
      where: { submittedAt: { gte: dateFrom, lte: dateTo }, ...(submittedById ? { submittedById } : {}) },
      include: { event: true, submittedBy: { include: { ledTroops: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  },

  // Financial — Admin/Executive Council only, enforced at the service layer.
  listPaymentsInRange(dateFrom: Date, dateTo: Date) {
    return prisma.payment.findMany({
      where: { paymentDate: { gte: dateFrom, lte: dateTo }, status: 'paid' },
      include: { member: true, feeType: true },
      orderBy: { paymentDate: 'desc' },
    });
  },
  listExpensesInRange(dateFrom: Date, dateTo: Date) {
    return prisma.expense.findMany({
      where: { expenseDate: { gte: dateFrom, lte: dateTo } },
      orderBy: { expenseDate: 'desc' },
    });
  },

  // Executive — org-wide cross-domain counts, Admin/Executive Council only.
  countTotalMembers() {
    return prisma.member.count();
  },
  countNewMembersInRange(dateFrom: Date, dateTo: Date) {
    return prisma.member.count({ where: { createdAt: { gte: dateFrom, lte: dateTo } } });
  },
  countEventsInRange(dateFrom: Date, dateTo: Date) {
    return prisma.event.count({ where: { eventDate: { gte: dateFrom, lte: dateTo } } });
  },
  countBadgesAwardedInRange(dateFrom: Date, dateTo: Date) {
    return prisma.memberBadge.count({
      where: { earnedAt: { gte: dateFrom, lte: dateTo }, status: { in: ['earned', 'verified'] } },
    });
  },

  // Report history — the persisted record of every export.
  listHistory(reportTypes: string[], page: number, pageSize: number) {
    const where: Prisma.ReportWhereInput = { reportType: { in: reportTypes } };
    return Promise.all([
      prisma.report.findMany({
        where,
        include: { generatedBy: true },
        orderBy: { generatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.report.count({ where }),
    ]);
  },

  findReportById(id: string) {
    return prisma.report.findUnique({ where: { id }, include: { generatedBy: true } });
  },

  createReport(input: { title: string; reportType: string; format: 'pdf' | 'excel'; filePath: string; generatedById: string }) {
    return prisma.report.create({ data: input, include: { generatedBy: true } });
  },
};
