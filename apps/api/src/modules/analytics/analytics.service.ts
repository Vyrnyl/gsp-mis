import { analyticsRepository } from './analytics.repository';
import type { DateRange, OverviewQuery } from './analytics.schema';
import type {
  AnalyticsSnapshotDto,
  AnalyticsStatValueDto,
  AttendanceAnalyticsDto,
  BadgeAnalyticsDto,
  EventParticipationDto,
  FinancialAnalyticsDto,
  MembershipAnalyticsDto,
  MonthlyFinancePointDto,
  OrganizationAnalyticsDto,
  ParticipationAnalyticsDto,
  TrendPointDto,
} from './analytics.types';

type MemberRow = { id: string; createdAt: Date; troopId: string | null; status: { name: string } };
type EventRow = {
  id: string;
  title: string;
  eventDate: Date;
  registrations: { id: string }[];
  attendanceRecords: { attendanceStatus: string; member: { troopId: string | null } }[];
};
type MemberBadgeRow = { id: string; badgeId: string; status: string; member: { troopId: string | null } };

function stat(id: string, label: string, value: number | string): AnalyticsStatValueDto {
  return { id, label, value };
}

function rate(present: number, total: number): number {
  return total > 0 ? Math.round((present / total) * 100) : 0;
}

/**
 * How many calendar months each preset spans, counting the current (partial) month
 * as one. `ytd` is variable — January is 1 month, December is 12 — so it is resolved
 * against the current date rather than being a fixed number.
 */
function monthSpan(range: DateRange): number {
  const now = new Date();
  switch (range) {
    case '3m':
      return 3;
    case '6m':
      return 6;
    case '12m':
      return 12;
    case 'ytd':
      return now.getMonth() + 1;
  }
}

/** First instant of the oldest calendar month in the range — the cutoff every
 * date-bound repository query and trend bucket is derived from, so the stat cards and
 * the chart beneath them always cover exactly the same window. */
function rangeStart(range: DateRange): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - (monthSpan(range) - 1), 1);
}

/** Calendar months in the range, oldest first — same bucketing technique as the
 * dashboard/finance features' own monthly-trend builders, generalized from a
 * hardcoded 6 to the selected range. Labels carry the year once the span can cross a
 * year boundary (12m/ytd), so two different "Jan" bars are never ambiguous. */
function monthBuckets(range: DateRange): { label: string; key: string }[] {
  const now = new Date();
  const span = monthSpan(range);
  const showYear = span > 6;

  return Array.from({ length: span }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (span - 1 - i), 1);
    const label = month.toLocaleString('en-US', { month: 'short' });
    return {
      label: showYear ? `${label} ${String(month.getFullYear()).slice(2)}` : label,
      key: `${month.getFullYear()}-${month.getMonth()}`,
    };
  });
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

/** Roster counts (total/active/pending) are point-in-time and stay unfiltered by date
 * — a member active today is active regardless of the window being viewed. Only
 * "New" and the registrations trend are date-bound. */
function buildMembershipAnalytics(members: MemberRow[], range: DateRange): MembershipAnalyticsDto {
  const active = members.filter((m) => m.status.name === 'active').length;
  const pending = members.filter((m) => m.status.name === 'pending').length;
  const since = rangeStart(range);
  const newThisPeriod = members.filter((m) => m.createdAt >= since).length;

  const trend: TrendPointDto[] = monthBuckets(range).map(({ label, key }) => ({
    label,
    value: members.filter((m) => monthKey(m.createdAt) === key).length,
  }));

  return {
    stats: [
      stat('totalMembers', 'Total Members', members.length),
      stat('active', 'Active', active),
      stat('pending', 'Pending', pending),
      stat('newThisPeriod', 'New (in range)', newThisPeriod),
    ],
    trend,
  };
}

function buildAttendanceAnalytics(events: EventRow[], range: DateRange): AttendanceAnalyticsDto {
  const heldEvents = events.filter((e) => e.attendanceRecords.length > 0);
  const totalPresent = heldEvents.reduce((sum, e) => sum + e.attendanceRecords.filter((r) => r.attendanceStatus === 'present').length, 0);
  const totalAbsent = heldEvents.reduce((sum, e) => sum + e.attendanceRecords.filter((r) => r.attendanceStatus === 'absent').length, 0);

  const trend: TrendPointDto[] = monthBuckets(range).map(({ label, key }) => {
    const bucketEvents = heldEvents.filter((e) => monthKey(e.eventDate) === key);
    const present = bucketEvents.reduce((sum, e) => sum + e.attendanceRecords.filter((r) => r.attendanceStatus === 'present').length, 0);
    const absent = bucketEvents.reduce((sum, e) => sum + e.attendanceRecords.filter((r) => r.attendanceStatus === 'absent').length, 0);
    return { label, value: rate(present, present + absent) };
  });

  return {
    stats: [
      stat('eventsHeld', 'Events Held', heldEvents.length),
      stat('avgRate', 'Avg. Attendance Rate', `${rate(totalPresent, totalPresent + totalAbsent)}%`),
      stat('totalPresent', 'Total Present', totalPresent),
      stat('totalAbsent', 'Total Absent', totalAbsent),
    ],
    trend,
  };
}

function buildParticipationAnalytics(events: EventRow[]): ParticipationAnalyticsDto {
  const withRegistrations = events.filter((e) => e.registrations.length > 0);
  const totalRegistrations = withRegistrations.reduce((sum, e) => sum + e.registrations.length, 0);
  const totalPresent = withRegistrations.reduce((sum, e) => sum + e.attendanceRecords.filter((r) => r.attendanceStatus === 'present').length, 0);
  const totalAbsent = withRegistrations.reduce((sum, e) => sum + e.attendanceRecords.filter((r) => r.attendanceStatus === 'absent').length, 0);

  // `events` is already ordered `eventDate desc` (analytics.repository) — most
  // recent 8 events with at least one registration, same "recent slice" precedent
  // as the dashboard's Recent Activity list.
  const byEvent: EventParticipationDto[] = withRegistrations.slice(0, 8).map((event) => {
    const present = event.attendanceRecords.filter((r) => r.attendanceStatus === 'present').length;
    const absent = event.attendanceRecords.filter((r) => r.attendanceStatus === 'absent').length;
    return {
      eventId: event.id,
      eventTitle: event.title,
      registrations: event.registrations.length,
      attendanceRate: rate(present, present + absent),
    };
  });

  return {
    stats: [
      stat('totalRegistrations', 'Total Registrations', totalRegistrations),
      stat('avgPerEvent', 'Avg. Registrants / Event', withRegistrations.length > 0 ? Math.round(totalRegistrations / withRegistrations.length) : 0),
      stat('avgAttendanceRate', 'Avg. Attendance Rate', `${rate(totalPresent, totalPresent + totalAbsent)}%`),
    ],
    byEvent,
  };
}

function buildBadgeAnalytics(catalog: { id: string; name: string }[], memberBadges: MemberBadgeRow[], totalMembers: number): BadgeAnalyticsDto {
  const awarded = memberBadges.filter((mb) => mb.status === 'earned' || mb.status === 'verified');
  const verified = memberBadges.filter((mb) => mb.status === 'verified').length;
  const inProgress = memberBadges.filter((mb) => mb.status === 'in_progress').length;

  const completionByBadge = catalog
    .map((badge) => {
      const earnedCount = awarded.filter((mb) => mb.badgeId === badge.id).length;
      return { badgeId: badge.id, badgeName: badge.name, completionRate: rate(earnedCount, totalMembers) };
    })
    .sort((a, b) => b.completionRate - a.completionRate);

  return {
    stats: [
      stat('totalAwarded', 'Badges Awarded', awarded.length),
      stat('verified', 'Verified', verified),
      stat('inProgress', 'In Progress', inProgress),
    ],
    completionByBadge,
  };
}

function buildMonthlyFinanceTrend(
  payments: { paymentDate: Date; amount: { toNumber(): number } }[],
  expenses: { expenseDate: Date; amount: { toNumber(): number } }[],
  range: DateRange,
): MonthlyFinancePointDto[] {
  return monthBuckets(range).map(({ label, key }) => ({
    label,
    income: payments.filter((p) => monthKey(p.paymentDate) === key).reduce((sum, p) => sum + p.amount.toNumber(), 0),
    expense: expenses.filter((e) => monthKey(e.expenseDate) === key).reduce((sum, e) => sum + e.amount.toNumber(), 0),
  }));
}

/**
 * Stats are summed from the *same in-range rows* that build the trend, not from
 * all-time aggregates. Before the filter revision these were lifetime totals sitting
 * above a 6-month chart, which was already mildly inconsistent; with a selectable
 * range it would have been actively misleading (pick "Last 3 months", watch the chart
 * change while "Total Income" doesn't). Labels say "in range" so the scope is explicit
 * — Finance (3.1) remains the place to see all-time council totals.
 */
function buildFinancialAnalytics(
  paymentsSince: { paymentDate: Date; amount: { toNumber(): number } }[],
  expensesSince: { expenseDate: Date; amount: { toNumber(): number } }[],
  range: DateRange,
): FinancialAnalyticsDto {
  const income = paymentsSince.reduce((sum, p) => sum + p.amount.toNumber(), 0);
  const expense = expensesSince.reduce((sum, e) => sum + e.amount.toNumber(), 0);

  return {
    stats: [
      stat('income', 'Income (in range)', income),
      stat('expenses', 'Expenses (in range)', expense),
      stat('balance', 'Net (in range)', income - expense),
    ],
    trend: buildMonthlyFinanceTrend(paymentsSince, expensesSince, range),
  };
}

function buildOrganizationAnalytics(
  troops: { id: string; name: string }[],
  members: MemberRow[],
  events: EventRow[],
  memberBadges: MemberBadgeRow[],
): OrganizationAnalyticsDto {
  const troopPerformance = troops.map((troop) => {
    const memberCount = members.filter((m) => m.troopId === troop.id).length;
    const records = events.flatMap((e) => e.attendanceRecords).filter((r) => r.member.troopId === troop.id);
    const present = records.filter((r) => r.attendanceStatus === 'present').length;
    const absent = records.filter((r) => r.attendanceStatus === 'absent').length;
    const badgesEarned = memberBadges.filter(
      (mb) => mb.member.troopId === troop.id && (mb.status === 'earned' || mb.status === 'verified'),
    ).length;

    return {
      troopId: troop.id,
      troopName: troop.name,
      memberCount,
      attendanceRate: rate(present, present + absent),
      badgesEarned,
    };
  });

  const topAttendanceRate = troopPerformance.reduce((max, t) => Math.max(max, t.attendanceRate), 0);

  return {
    stats: [
      stat('totalTroops', 'Total Troops', troops.length),
      stat('avgMembersPerTroop', 'Avg. Members / Troop', troops.length > 0 ? Math.round(members.length / troops.length) : 0),
      stat('topAttendanceRate', 'Top Attendance Rate', `${topAttendanceRate}%`),
    ],
    troops: troopPerformance,
  };
}

export const analyticsService = {
  // Every figure is computed live from real rows (members/events/badges/payments),
  // same "no stored snapshot" simplification precedent as finance/reports —
  // `AnalyticsSnapshot` the schema model stays unused (build-plan.md never scopes
  // saving/browsing historical snapshots, only live aggregation).
  async getOverview(query: OverviewQuery): Promise<AnalyticsSnapshotDto> {
    const { range, troopId } = query;
    const since = rangeStart(range);

    // The Organization tab is the per-troop comparison itself, so it is built from
    // deliberately unscoped rows — filtering to one troop would collapse it to a
    // single row and destroy the only view that answers "how do troops compare?".
    // The frontend disables the troop filter on that tab to match.
    const [members, events, badgeCatalog, memberBadges, troops, orgMembers, orgEvents, orgMemberBadges, paymentsSince, expensesSince] =
      await Promise.all([
        analyticsRepository.listMembers(troopId),
        analyticsRepository.listEventsWithDetail(since, troopId),
        analyticsRepository.listBadgeCatalog(),
        analyticsRepository.listMemberBadges(troopId),
        analyticsRepository.listTroops(),
        troopId ? analyticsRepository.listMembers() : null,
        troopId ? analyticsRepository.listEventsWithDetail(since) : null,
        troopId ? analyticsRepository.listMemberBadges() : null,
        analyticsRepository.paymentsSince(since),
        analyticsRepository.expensesSince(since),
      ]);

    return {
      membership: buildMembershipAnalytics(members, range),
      attendance: buildAttendanceAnalytics(events, range),
      participation: buildParticipationAnalytics(events),
      badges: buildBadgeAnalytics(badgeCatalog, memberBadges, members.length),
      financial: buildFinancialAnalytics(paymentsSince, expensesSince, range),
      organization: buildOrganizationAnalytics(
        troops,
        orgMembers ?? members,
        orgEvents ?? events,
        orgMemberBadges ?? memberBadges,
      ),
      generatedAt: new Date().toISOString(),
    };
  },
};
