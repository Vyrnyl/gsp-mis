import { prisma } from '../../config/prisma';

/**
 * Every list method takes an explicit `troopId` filter (undefined = all troops) and,
 * where the metric is time-bound, a `since` date. Before the 2026-09-02 filter
 * revision these were unfiltered `findMany`s that pulled whole tables into memory for
 * the service to filter in JS; the filters are now pushed down into Prisma `where`
 * clauses so a narrower selection reads fewer rows rather than the same full table.
 */
export const analyticsRepository = {
  /** Not date-filtered — "Total Members"/"Active"/"Pending" are roster counts (a
   * point-in-time snapshot), not flows, so a date range must not shrink them. The
   * date-bound "New in range" figure and the registrations trend are derived from
   * `createdAt` on these same rows in the service. */
  listMembers(troopId?: string) {
    return prisma.member.findMany({
      where: troopId ? { troopId } : undefined,
      select: { id: true, createdAt: true, troopId: true, status: { select: { name: true } } },
    });
  },

  // One row per event, with just enough nested detail to drive attendance,
  // participation and per-troop attendance rate without a second round trip.
  //
  // `troopId` filters the nested attendance records rather than the events
  // themselves: an event is council-wide, so scoping to a troop means "this troop's
  // participation in these events", not "events belonging to this troop". Events
  // with no matching records then fall out of the derived stats naturally, since
  // every downstream figure keys off a non-empty `attendanceRecords`/`registrations`.
  listEventsWithDetail(since: Date, troopId?: string) {
    return prisma.event.findMany({
      where: { eventDate: { gte: since } },
      select: {
        id: true,
        title: true,
        eventDate: true,
        registrations: {
          where: troopId ? { member: { troopId } } : undefined,
          select: { id: true },
        },
        attendanceRecords: {
          where: troopId ? { member: { troopId } } : undefined,
          select: { attendanceStatus: true, member: { select: { troopId: true } } },
        },
      },
      orderBy: { eventDate: 'desc' },
    });
  },

  listBadgeCatalog() {
    return prisma.badge.findMany({ select: { id: true, name: true } });
  },

  listMemberBadges(troopId?: string) {
    return prisma.memberBadge.findMany({
      where: troopId ? { member: { troopId } } : undefined,
      select: { id: true, badgeId: true, status: true, member: { select: { troopId: true } } },
    });
  },

  /** Always the full list — the Organization tab is the per-troop comparison, so it
   * ignores the troop filter by design (see `analytics.service`). */
  listTroops() {
    return prisma.troop.findMany({ select: { id: true, name: true } });
  },

  // Income/expense are council-level, with no troop association anywhere in the
  // schema (`Payment` links to a member, `Expense` to nothing troop-scoped), so the
  // troop filter deliberately does not apply here — see the service's note on why
  // the Financial tab disables it rather than silently returning unfiltered numbers.
  paymentsSince(since: Date) {
    return prisma.payment.findMany({
      where: { status: 'paid', paymentDate: { gte: since } },
      select: { paymentDate: true, amount: true },
    });
  },

  expensesSince(since: Date) {
    return prisma.expense.findMany({
      where: { expenseDate: { gte: since } },
      select: { expenseDate: true, amount: true },
    });
  },
};
