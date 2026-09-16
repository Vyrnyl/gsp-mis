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
      select: {
        id: true,
        createdAt: true,
        troopId: true,
        status: { select: { name: true } },
        // Promotion readiness (2026-09-16) — compared against the member's level's
        // structured `minAge`/`maxAge`. Nullable, and members without one are skipped
        // rather than assumed to be any particular age.
        birthDate: true,
        // Breakdown dimensions (2026-09-16 revision). Both are nullable FKs, so the
        // service buckets missing values under an explicit "Unassigned" row rather
        // than dropping those members — a member with no school still counts toward
        // the council total, and silently losing rows from a breakdown is exactly
        // how a "which school is worst?" answer goes wrong.
        school: { select: { id: true, name: true } },
        scoutLevel: { select: { id: true, name: true, orderNumber: true } },
      },
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
        // Activity category (2026-09-16 revision) — drives the per-activity-type
        // breakdown and the "activities needing support" signal. Nullable, so the
        // service buckets a missing category as "Uncategorized".
        category: { select: { id: true, name: true } },
        registrations: {
          where: troopId ? { member: { troopId } } : undefined,
          select: { id: true },
        },
        attendanceRecords: {
          where: troopId ? { member: { troopId } } : undefined,
          // `member.school`/`scoutLevel` here are what make per-school and per-level
          // attendance derivable at all: attendance has no school FK of its own, so
          // the dimension is reached through the member who attended.
          select: {
            attendanceStatus: true,
            member: {
              select: {
                troopId: true,
                school: { select: { id: true, name: true } },
                scoutLevel: { select: { id: true, name: true, orderNumber: true } },
              },
            },
          },
        },
      },
      orderBy: { eventDate: 'desc' },
    });
  },

  listBadgeCatalog() {
    return prisma.badge.findMany({
      // Badge category (2026-09-16 revision) — the brief asks which *areas*
      // (Leadership, Arts & Culture…) are strongest/weakest, which is a property of
      // `BadgeCategory`, not of an individual badge.
      select: { id: true, name: true, category: { select: { id: true, name: true } } },
    });
  },

  listMemberBadges(troopId?: string) {
    return prisma.memberBadge.findMany({
      where: troopId ? { member: { troopId } } : undefined,
      select: {
        id: true,
        badgeId: true,
        status: true,
        member: {
          select: {
            id: true,
            troopId: true,
            school: { select: { id: true, name: true } },
            scoutLevel: { select: { id: true, name: true, orderNumber: true } },
          },
        },
      },
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
      select: {
        paymentDate: true,
        amount: true,
        // Income *is* attributable: `Payment` links to a member, and a member links
        // to a school. This is the derivable half of the brief's "break down income
        // and expenses by school" ask — the expense half is not (see `expensesSince`).
        member: { select: { school: { select: { id: true, name: true } } } },
      },
    });
  },

  /**
   * Expenses became attributable on 2026-09-16 — `schoolId`/`eventId` FKs plus a
   * controlled `expenseCategory` relation replaced the free-text-only shape that
   * previously made "which school has the highest expenses" underivable.
   *
   * `category` (the legacy string) is still selected because rows recorded before that
   * migration carry their only categorisation there; the service reads the relation
   * first and falls back to the string, so old and new expenses appear in one view
   * instead of the older half silently vanishing.
   *
   * Both FKs stay nullable: a genuinely council-wide cost belongs to no school or
   * event, and is reported under an explicit "Council-wide" bucket rather than being
   * forced into one.
   */
  expensesSince(since: Date) {
    return prisma.expense.findMany({
      where: { expenseDate: { gte: since } },
      select: {
        expenseDate: true,
        amount: true,
        category: true,
        expenseCategory: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
      },
    });
  },

  /** Scout levels with their structured age bands (2026-09-16). Previously the bands
   * existed only as prose in `description`, so promotion-readiness was underivable
   * without parsing English. `minAge`/`maxAge` are nullable — a level need not be
   * age-bound, and the service skips those rather than assuming a bound. */
  listScoutLevels() {
    return prisma.scoutLevel.findMany({
      select: { id: true, name: true, orderNumber: true, minAge: true, maxAge: true },
      orderBy: { orderNumber: 'asc' },
    });
  },
};
