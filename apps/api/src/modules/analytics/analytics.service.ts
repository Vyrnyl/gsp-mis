import { analyticsRepository } from './analytics.repository';
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

function sixMonthsAgo(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 5, 1);
}

/** Last 6 calendar months, oldest first — same bucketing technique as the
 * dashboard/finance features' own monthly-trend builders. */
function monthBuckets(): { label: string; key: string }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: month.toLocaleString('en-US', { month: 'short' }), key: `${month.getFullYear()}-${month.getMonth()}` };
  });
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function buildMembershipAnalytics(members: MemberRow[]): MembershipAnalyticsDto {
  const active = members.filter((m) => m.status.name === 'active').length;
  const pending = members.filter((m) => m.status.name === 'pending').length;
  const since = sixMonthsAgo();
  const newThisPeriod = members.filter((m) => m.createdAt >= since).length;

  const trend: TrendPointDto[] = monthBuckets().map(({ label, key }) => ({
    label,
    value: members.filter((m) => monthKey(m.createdAt) === key).length,
  }));

  return {
    stats: [
      stat('totalMembers', 'Total Members', members.length),
      stat('active', 'Active', active),
      stat('pending', 'Pending', pending),
      stat('newThisPeriod', 'New (6 mo.)', newThisPeriod),
    ],
    trend,
  };
}

function buildAttendanceAnalytics(events: EventRow[]): AttendanceAnalyticsDto {
  const heldEvents = events.filter((e) => e.attendanceRecords.length > 0);
  const totalPresent = heldEvents.reduce((sum, e) => sum + e.attendanceRecords.filter((r) => r.attendanceStatus === 'present').length, 0);
  const totalAbsent = heldEvents.reduce((sum, e) => sum + e.attendanceRecords.filter((r) => r.attendanceStatus === 'absent').length, 0);

  const trend: TrendPointDto[] = monthBuckets().map(({ label, key }) => {
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
): MonthlyFinancePointDto[] {
  return monthBuckets().map(({ label, key }) => ({
    label,
    income: payments.filter((p) => monthKey(p.paymentDate) === key).reduce((sum, p) => sum + p.amount.toNumber(), 0),
    expense: expenses.filter((e) => monthKey(e.expenseDate) === key).reduce((sum, e) => sum + e.amount.toNumber(), 0),
  }));
}

function buildFinancialAnalytics(
  totalIncome: number,
  totalExpense: number,
  paymentsSince: { paymentDate: Date; amount: { toNumber(): number } }[],
  expensesSince: { expenseDate: Date; amount: { toNumber(): number } }[],
): FinancialAnalyticsDto {
  return {
    stats: [
      stat('income', 'Total Income', totalIncome),
      stat('expenses', 'Total Expenses', totalExpense),
      stat('balance', 'Council Balance', totalIncome - totalExpense),
    ],
    trend: buildMonthlyFinanceTrend(paymentsSince, expensesSince),
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
  async getOverview(): Promise<AnalyticsSnapshotDto> {
    const since = sixMonthsAgo();
    const [members, events, badgeCatalog, memberBadges, troops, incomeAgg, expenseAgg, paymentsSince, expensesSince] =
      await Promise.all([
        analyticsRepository.listMembers(),
        analyticsRepository.listEventsWithDetail(),
        analyticsRepository.listBadgeCatalog(),
        analyticsRepository.listMemberBadges(),
        analyticsRepository.listTroops(),
        analyticsRepository.totalIncome(),
        analyticsRepository.totalExpenses(),
        analyticsRepository.paymentsSince(since),
        analyticsRepository.expensesSince(since),
      ]);

    const totalIncome = incomeAgg._sum.amount?.toNumber() ?? 0;
    const totalExpense = expenseAgg._sum.amount?.toNumber() ?? 0;

    return {
      membership: buildMembershipAnalytics(members),
      attendance: buildAttendanceAnalytics(events),
      participation: buildParticipationAnalytics(events),
      badges: buildBadgeAnalytics(badgeCatalog, memberBadges, members.length),
      financial: buildFinancialAnalytics(totalIncome, totalExpense, paymentsSince, expensesSince),
      organization: buildOrganizationAnalytics(troops, members, events, memberBadges),
      generatedAt: new Date().toISOString(),
    };
  },
};
