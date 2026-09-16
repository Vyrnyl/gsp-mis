import { prisma } from '../../config/prisma';

/**
 * Filters applied at the database level. `troopId` is page-level (2026-09-02); the
 * rest are the per-tab dimension filters added by the 2026-09-16 R4 revision.
 *
 * Every field is optional and `undefined` means "no filter", so a caller that passes
 * nothing reads exactly what it read before either revision.
 */
export interface AnalyticsFilterScope {
  troopId?: string;
  schoolId?: string;
  scoutLevelId?: string;
  /** `MemberStatus.name` (`active`/`pending`/…), not an id — see `analytics.schema`. */
  status?: string;
  activityCategoryId?: string;
  badgeCategoryId?: string;
  expenseCategoryId?: string;
}

/**
 * The member-shaped `where` reused by every member-rooted query. Members, attendance
 * records and member-badges all reach school/level/troop/status through a `Member`,
 * so the clause is built once and nested at the right depth by each caller rather
 * than being spelled out four times — that repetition is how one query ends up
 * quietly ignoring a filter the others honour.
 */
function memberWhere(scope: AnalyticsFilterScope) {
  return {
    ...(scope.troopId ? { troopId: scope.troopId } : {}),
    ...(scope.schoolId ? { schoolId: scope.schoolId } : {}),
    ...(scope.scoutLevelId ? { scoutLevelId: scope.scoutLevelId } : {}),
    ...(scope.status ? { status: { name: scope.status } } : {}),
  };
}

/** `{}` would be a valid-but-pointless Prisma filter; collapse it to `undefined` so
 * the unfiltered query plan stays identical to the pre-revision one. */
function orUndefined<T extends object>(where: T): T | undefined {
  return Object.keys(where).length > 0 ? where : undefined;
}

/**
 * Every list method takes an explicit filter scope and, where the metric is
 * time-bound, a `since` date. Before the 2026-09-02 filter revision these were
 * unfiltered `findMany`s that pulled whole tables into memory for the service to
 * filter in JS; the filters are now pushed down into Prisma `where` clauses so a
 * narrower selection reads fewer rows rather than the same full table. The R4
 * dimension filters follow that same rule rather than filtering in the service.
 */
export const analyticsRepository = {
  /** Not date-filtered — "Total Members"/"Active"/"Pending" are roster counts (a
   * point-in-time snapshot), not flows, so a date range must not shrink them. The
   * date-bound "New in range" figure and the registrations trend are derived from
   * `createdAt` on these same rows in the service. */
  listMembers(scope: AnalyticsFilterScope = {}) {
    return prisma.member.findMany({
      where: orUndefined(memberWhere(scope)),
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
  // The member-shaped filters scope the nested registration/attendance records rather
  // than the events themselves: an event is council-wide, so scoping to a troop (or a
  // school, or a level) means "this group's participation in these events", not
  // "events belonging to this group". Events with no matching records then fall out
  // of the derived stats naturally, since every downstream figure keys off a
  // non-empty `attendanceRecords`/`registrations`.
  //
  // `activityCategoryId` is the exception — it is a property of the *event*, so it
  // filters the outer query and genuinely removes events from the set.
  listEventsWithDetail(since: Date, scope: AnalyticsFilterScope = {}) {
    const member = orUndefined(memberWhere(scope));
    const recordWhere = member ? { member } : undefined;

    return prisma.event.findMany({
      where: {
        eventDate: { gte: since },
        ...(scope.activityCategoryId ? { categoryId: scope.activityCategoryId } : {}),
      },
      select: {
        id: true,
        title: true,
        eventDate: true,
        // Activity category (2026-09-16 revision) — drives the per-activity-type
        // breakdown and the "activities needing support" signal. Nullable, so the
        // service buckets a missing category as "Uncategorized".
        category: { select: { id: true, name: true } },
        registrations: {
          where: recordWhere,
          // `member` was added by the R4 revision's Participation step: per-school
          // participation and the active-vs-inactive split both need to know *who*
          // registered, not just how many did. Registration has no school FK of its
          // own, so — like attendance — the dimension is reached through the member.
          select: { id: true, member: { select: { id: true, school: { select: { id: true, name: true } } } } },
        },
        attendanceRecords: {
          where: recordWhere,
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

  listBadgeCatalog(scope: AnalyticsFilterScope = {}) {
    return prisma.badge.findMany({
      where: scope.badgeCategoryId ? { categoryId: scope.badgeCategoryId } : undefined,
      // Badge category (2026-09-16 revision) — the brief asks which *areas*
      // (Leadership, Arts & Culture…) are strongest/weakest, which is a property of
      // `BadgeCategory`, not of an individual badge.
      select: { id: true, name: true, category: { select: { id: true, name: true } } },
    });
  },

  listMemberBadges(scope: AnalyticsFilterScope = {}) {
    const member = orUndefined(memberWhere(scope));
    return prisma.memberBadge.findMany({
      where: orUndefined({
        ...(member ? { member } : {}),
        // Badge area filters the badge, not the member who earned it.
        ...(scope.badgeCategoryId ? { badge: { categoryId: scope.badgeCategoryId } } : {}),
      }),
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

  // Income is attributable through the paying member; expenses became attributable in
  // their own right on 2026-09-16 (see `expensesSince`). The troop filter still does
  // not apply to either — no troop association exists anywhere in the money schema —
  // which is why the Financial tab disables that one filter rather than silently
  // returning unfiltered numbers.
  paymentsSince(since: Date, scope: AnalyticsFilterScope = {}) {
    return prisma.payment.findMany({
      where: {
        status: 'paid',
        paymentDate: { gte: since },
        // Income reaches a school through the member who paid. Activity and expense
        // category have no meaning on the income side, so they are ignored here
        // rather than zeroing income; the service documents that asymmetry where it
        // renders the comparison.
        ...(scope.schoolId ? { member: { schoolId: scope.schoolId } } : {}),
      },
      select: {
        paymentDate: true,
        amount: true,
        // Income *is* attributable: `Payment` links to a member, and a member links
        // to a school. This is the derivable half of the brief's "break down income
        // and expenses by school" ask — the expense half became derivable too once
        // the 2026-09-16 attribution migration landed.
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
  expensesSince(since: Date, scope: AnalyticsFilterScope = {}) {
    return prisma.expense.findMany({
      where: {
        expenseDate: { gte: since },
        ...(scope.schoolId ? { schoolId: scope.schoolId } : {}),
        ...(scope.expenseCategoryId ? { categoryId: scope.expenseCategoryId } : {}),
        // An activity filter on the money side means "spending on events of this
        // type", reached through the expense's own event FK.
        ...(scope.activityCategoryId ? { event: { categoryId: scope.activityCategoryId } } : {}),
      },
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

  /**
   * The council's full badge- and activity-category vocabularies, deliberately ignoring
   * every filter (2026-09-16 R4 step 4).
   *
   * Community engagement identifies "community" by category *name* — there is no flag
   * for it in the schema — and these names are what the card states as its definition.
   * Reading them from the filtered rows instead would let a filter rewrite that
   * definition: narrowing to Camping would drop "Community Outreach" from the sentence
   * while the figures beside it stayed. The filter must change the numbers, never what
   * the numbers claim to be.
   */
  listCategoryVocabularies() {
    return Promise.all([
      prisma.badgeCategory.findMany({ select: { name: true } }),
      prisma.activityCategory.findMany({ select: { name: true } }),
    ]);
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
