import { analyticsRepository } from './analytics.repository';
import type { DateRange, OverviewQuery } from './analytics.schema';
import type {
  ActivityCategoryRowDto,
  AnalyticsSnapshotDto,
  AnalyticsStatValueDto,
  AttendanceAnalyticsDto,
  BadgeAnalyticsDto,
  BreakdownAnalyticsDto,
  DecisionSupportDto,
  DimensionBreakdownRowDto,
  EventParticipationDto,
  FinancialAnalyticsDto,
  InsightDto,
  MembershipAnalyticsDto,
  MoneySliceDto,
  MonthlyFinancePointDto,
  OrganizationAnalyticsDto,
  ParticipationAnalyticsDto,
  PromotionReadinessRowDto,
  SchoolFinanceRowDto,
  TrendPointDto,
} from './analytics.types';

/** A nullable named dimension as selected by the repository (school, scout level,
 * badge category, activity category all share this shape). */
type NamedRef = { id: string; name: string } | null;
type LevelRef = { id: string; name: string; orderNumber: number } | null;

type MemberRow = {
  id: string;
  createdAt: Date;
  troopId: string | null;
  status: { name: string };
  birthDate: Date | null;
  school: NamedRef;
  scoutLevel: LevelRef;
};
type ScoutLevelRow = { id: string; name: string; orderNumber: number; minAge: number | null; maxAge: number | null };
type AttendanceMemberRef = { troopId: string | null; school: NamedRef; scoutLevel: LevelRef };
type EventRow = {
  id: string;
  title: string;
  eventDate: Date;
  category: NamedRef;
  registrations: { id: string }[];
  attendanceRecords: { attendanceStatus: string; member: AttendanceMemberRef }[];
};
type MemberBadgeRow = {
  id: string;
  badgeId: string;
  status: string;
  member: { id: string; troopId: string | null; school: NamedRef; scoutLevel: LevelRef };
};
type BadgeCatalogRow = { id: string; name: string; category: NamedRef };
type PaymentRow = { paymentDate: Date; amount: { toNumber(): number }; member: { school: NamedRef } };
type ExpenseRow = {
  expenseDate: Date;
  amount: { toNumber(): number };
  /** Legacy free-text label, kept for rows predating the controlled vocabulary. */
  category: string | null;
  expenseCategory: NamedRef;
  school: NamedRef;
  event: { id: string; title: string } | null;
};

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

// ─────────────────────────────────────────────────────────────
// Breakdown dimensions + Decision-Making (2026-09-16 revision)
// ─────────────────────────────────────────────────────────────

/** Members with no school/level still belong to the council, so they are bucketed
 * under an explicit label rather than dropped — a breakdown that silently loses rows
 * makes "which school is worst?" wrong in a way nobody can see. */
const UNASSIGNED_SCHOOL = 'No school recorded';
const UNASSIGNED_LEVEL = 'No level assigned';
const UNCATEGORIZED = 'Uncategorized';
/** Spending with no school or event attached. A real category — many council costs
 * genuinely are council-wide — so it is labelled, not hidden. */
const COUNCIL_WIDE = 'Council-wide';

/**
 * Below this many members a group is not ranked. A school with 2 members at 0%
 * attendance is noise, not the council's worst school, and acting on it would
 * misdirect real budget. Suppressed groups are reported separately (never hidden)
 * so "too small to judge" is visibly different from "doing fine".
 */
const MIN_SAMPLE_SIZE = 3;

/** Attendance at or below this is treated as a genuine participation problem. */
const LOW_ATTENDANCE_THRESHOLD = 50;
/** Badges-per-member at or below this flags a weak achievement area. */
const LOW_BADGES_PER_MEMBER = 0.5;

/** Internal-only: carries `ScoutLevel.orderNumber` through sorting, stripped before
 * the row leaves the builder (the DTO has no `order` field — it is a sort key, not
 * something the UI renders). */
type OrderedBreakdownRow = DimensionBreakdownRowDto & { order: number };

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function share(amount: number, total: number): number {
  return total > 0 ? Math.round((amount / total) * 100) : 0;
}

/**
 * Groups members by a nullable named dimension and folds in attendance (reached
 * through `AttendanceRecord.member`, since attendance has no school/level FK of its
 * own) and badges earned.
 *
 * `keyOf` returns the group identity for a member; `memberKeyOf`/`badgeKeyOf` do the
 * same for an attendance record and a member-badge respectively. One generic builder
 * rather than three near-identical ones, since school and level differ only in which
 * field they read.
 */
function buildMemberDimension(
  members: MemberRow[],
  events: EventRow[],
  memberBadges: MemberBadgeRow[],
  pick: (ref: { school: NamedRef; scoutLevel: LevelRef }) => NamedRef | LevelRef,
  unassignedLabel: string,
  sort: (a: OrderedBreakdownRow, b: OrderedBreakdownRow) => number,
): DimensionBreakdownRowDto[] {
  const groups = new Map<string, { label: string; order: number; memberCount: number; present: number; absent: number; badges: number }>();

  const ensure = (ref: NamedRef | LevelRef) => {
    const id = ref?.id ?? 'unassigned';
    const label = ref?.name ?? unassignedLabel;
    // Scout levels carry a curriculum order (Twinkler → Cadet); schools don't, and
    // fall back to a constant so the caller's own sort decides. Unassigned sorts
    // last either way.
    const order = ref && 'orderNumber' in ref ? ref.orderNumber : Number.MAX_SAFE_INTEGER;
    let group = groups.get(id);
    if (!group) {
      group = { label, order: ref ? order : Number.MAX_SAFE_INTEGER, memberCount: 0, present: 0, absent: 0, badges: 0 };
      groups.set(id, group);
    }
    return group;
  };

  for (const member of members) {
    ensure(pick(member)).memberCount += 1;
  }

  for (const event of events) {
    for (const record of event.attendanceRecords) {
      const group = ensure(pick(record.member));
      if (record.attendanceStatus === 'present') group.present += 1;
      else if (record.attendanceStatus === 'absent') group.absent += 1;
    }
  }

  for (const memberBadge of memberBadges) {
    if (memberBadge.status !== 'earned' && memberBadge.status !== 'verified') continue;
    ensure(pick(memberBadge.member)).badges += 1;
  }

  return Array.from(groups.entries())
    .map(([id, group]) => ({
      id,
      label: group.label,
      order: group.order,
      memberCount: group.memberCount,
      attendanceRate: rate(group.present, group.present + group.absent),
      attendanceRecords: group.present + group.absent,
      badgesEarned: group.badges,
      badgesPerMember: group.memberCount > 0 ? round1(group.badges / group.memberCount) : 0,
    }))
    .sort(sort)
    .map(({ order: _order, ...row }) => row);
}

/** Badge *areas* (Leadership, Arts & Culture…) rather than individual badges — the
 * brief asks which areas are strongest/weakest. Keyed by the member who earned the
 * badge, so `memberCount` is "members holding at least one badge in this area". */
function buildBadgeCategoryBreakdown(catalog: BadgeCatalogRow[], memberBadges: MemberBadgeRow[]): DimensionBreakdownRowDto[] {
  const categoryOfBadge = new Map(catalog.map((badge) => [badge.id, badge.category]));
  const groups = new Map<string, { label: string; earners: Set<string>; badges: number }>();

  // Seed from the catalog so an area with zero earned badges still appears at 0 —
  // an area nobody is working on is precisely what "needs improvement" means, and it
  // would otherwise be invisible.
  for (const badge of catalog) {
    const id = badge.category?.id ?? 'uncategorized';
    if (!groups.has(id)) groups.set(id, { label: badge.category?.name ?? UNCATEGORIZED, earners: new Set(), badges: 0 });
  }

  for (const memberBadge of memberBadges) {
    if (memberBadge.status !== 'earned' && memberBadge.status !== 'verified') continue;
    const category = categoryOfBadge.get(memberBadge.badgeId) ?? null;
    const id = category?.id ?? 'uncategorized';
    let group = groups.get(id);
    if (!group) {
      group = { label: category?.name ?? UNCATEGORIZED, earners: new Set(), badges: 0 };
      groups.set(id, group);
    }
    group.badges += 1;
    group.earners.add(memberBadge.member.id);
  }

  return Array.from(groups.entries())
    .map(([id, group]) => ({
      id,
      label: group.label,
      memberCount: group.earners.size,
      // Not meaningful for a badge area — a badge is not an event. The UI drops the
      // column entirely on this dimension rather than showing a misleading 0%.
      attendanceRate: 0,
      attendanceRecords: 0,
      badgesEarned: group.badges,
      badgesPerMember: group.earners.size > 0 ? round1(group.badges / group.earners.size) : 0,
    }))
    .sort((a, b) => b.badgesEarned - a.badgesEarned);
}

/** Activity types (Camping, Community Outreach…) grouped by *event*, answering the
 * brief's "break down events by type of activity" and "activities needing support". */
function buildActivityCategoryBreakdown(events: EventRow[]): ActivityCategoryRowDto[] {
  const groups = new Map<
    string,
    { label: string; eventCount: number; registrations: number; present: number; absent: number; heldEvents: number }
  >();

  for (const event of events) {
    const id = event.category?.id ?? 'uncategorized';
    let group = groups.get(id);
    if (!group) {
      group = { label: event.category?.name ?? UNCATEGORIZED, eventCount: 0, registrations: 0, present: 0, absent: 0, heldEvents: 0 };
      groups.set(id, group);
    }
    group.eventCount += 1;
    group.registrations += event.registrations.length;
    // An event with no attendance records has not been held (or was never marked),
    // which is different from one where nobody turned up. Tracked separately so the
    // decision layer can tell "0% turnout" from "no data yet".
    if (event.attendanceRecords.length > 0) group.heldEvents += 1;
    group.present += event.attendanceRecords.filter((r) => r.attendanceStatus === 'present').length;
    group.absent += event.attendanceRecords.filter((r) => r.attendanceStatus === 'absent').length;
  }

  return Array.from(groups.entries())
    .map(([id, group]) => ({
      id,
      label: group.label,
      eventCount: group.eventCount,
      registrations: group.registrations,
      attendanceRate: rate(group.present, group.present + group.absent),
      heldEvents: group.heldEvents,
    }))
    .sort((a, b) => b.eventCount - a.eventCount);
}

function buildBreakdownAnalytics(
  members: MemberRow[],
  events: EventRow[],
  catalog: BadgeCatalogRow[],
  memberBadges: MemberBadgeRow[],
): BreakdownAnalyticsDto {
  return {
    bySchool: buildMemberDimension(members, events, memberBadges, (r) => r.school, UNASSIGNED_SCHOOL, (a, b) => b.memberCount - a.memberCount),
    // Levels sort by the curriculum's own order (Twinkler → Cadet), not by size —
    // a level breakdown reads as a progression, so reordering it by count would
    // make "which level thins out?" much harder to see.
    byLevel: buildMemberDimension(members, events, memberBadges, (r) => r.scoutLevel, UNASSIGNED_LEVEL, (a, b) => a.order - b.order),
    byBadgeCategory: buildBadgeCategoryBreakdown(catalog, memberBadges),
    byActivityCategory: buildActivityCategoryBreakdown(events),
  };
}

/**
 * Turns the breakdowns into ranked, thresholded findings — the brief's Decision-Making
 * section ("specific and actionable insights, not just total numbers").
 *
 * Two safeguards, both deliberate. **Small groups are never ranked**: below
 * `MIN_SAMPLE_SIZE` a percentage is noise, and this surface is the one place in the
 * app where a wrong number causes a wrong *action* (budget moved away from a troop).
 * **Every insight states the figure it rests on**, so a reader can sanity-check the
 * claim instead of trusting it.
 */
function buildDecisionSupport(
  breakdown: BreakdownAnalyticsDto,
  members: MemberRow[],
  payments: PaymentRow[],
  expenses: ExpenseRow[],
  scoutLevels: ScoutLevelRow[],
): DecisionSupportDto {
  const insights: InsightDto[] = [];
  const suppressed: DecisionSupportDto['suppressed'] = [];

  const rankable = (rows: DimensionBreakdownRowDto[]) => rows.filter((row) => row.memberCount >= MIN_SAMPLE_SIZE);

  for (const row of breakdown.bySchool) {
    if (row.memberCount > 0 && row.memberCount < MIN_SAMPLE_SIZE) {
      suppressed.push({
        label: row.label,
        memberCount: row.memberCount,
        reason: `Fewer than ${MIN_SAMPLE_SIZE} members — too few to rank fairly`,
      });
    }
  }

  // ── Schools with low participation ─────────────────────────
  // `attendanceRecords > 0` is the guard that separates "these members were invited
  // and did not come" from "this school has no attendance data at all" — only the
  // former is a participation problem worth acting on.
  const schoolsWithAttendance = rankable(breakdown.bySchool).filter((row) => row.attendanceRecords > 0);
  const weakestSchool = [...schoolsWithAttendance].sort((a, b) => a.attendanceRate - b.attendanceRate)[0];
  if (weakestSchool && weakestSchool.attendanceRate <= LOW_ATTENDANCE_THRESHOLD) {
    insights.push({
      id: 'school-low-participation',
      severity: weakestSchool.attendanceRate === 0 ? 'critical' : 'warning',
      category: 'participation',
      title: `${weakestSchool.label} has the lowest participation`,
      detail: `${weakestSchool.attendanceRate}% attendance across ${weakestSchool.memberCount} members — the lowest of any school with at least ${MIN_SAMPLE_SIZE} members.`,
      recommendation: 'Contact the school coordinator to identify barriers, and consider scheduling an activity at or near this school.',
      metric: `${weakestSchool.attendanceRate}% attendance`,
    });
  }

  // ── Levels with low performance ────────────────────────────
  const weakestLevel = [...rankable(breakdown.byLevel)].sort((a, b) => a.badgesPerMember - b.badgesPerMember)[0];
  if (weakestLevel && weakestLevel.badgesPerMember <= LOW_BADGES_PER_MEMBER) {
    insights.push({
      id: 'level-low-achievement',
      severity: 'warning',
      category: 'performance',
      title: `${weakestLevel.label} is earning the fewest badges`,
      detail: `${weakestLevel.badgesPerMember} badges per member across ${weakestLevel.memberCount} members, against a council average of ${councilBadgesPerMember(members, breakdown)}.`,
      recommendation: 'Review whether badge requirements at this level are age-appropriate, and plan a badge-focused session for this level.',
      metric: `${weakestLevel.badgesPerMember} badges/member`,
    });
  }

  // ── Badge areas needing improvement ────────────────────────
  const weakestArea = [...breakdown.byBadgeCategory].sort((a, b) => a.badgesEarned - b.badgesEarned)[0];
  const strongestArea = [...breakdown.byBadgeCategory].sort((a, b) => b.badgesEarned - a.badgesEarned)[0];
  if (weakestArea && strongestArea && weakestArea.id !== strongestArea.id) {
    insights.push({
      id: 'badge-area-gap',
      severity: weakestArea.badgesEarned === 0 ? 'critical' : 'info',
      category: 'achievement',
      title: `${weakestArea.label} is the weakest achievement area`,
      detail:
        weakestArea.badgesEarned === 0
          ? `No badges have been earned in ${weakestArea.label} at all, while ${strongestArea.label} has ${strongestArea.badgesEarned}.`
          : `${weakestArea.badgesEarned} badges earned in ${weakestArea.label}, against ${strongestArea.badgesEarned} in ${strongestArea.label}.`,
      recommendation: `Plan activities targeting ${weakestArea.label} badges, or check whether their requirements are achievable with available resources.`,
      metric: `${weakestArea.badgesEarned} badges earned`,
    });
  }

  // ── Activities needing support ─────────────────────────────
  // Only categories with at least one *held* event can have a turnout problem. An
  // upcoming camp with 6 registrations and no attendance taken yet reads as 0% but
  // is not a failure — flagging it would send the council to fix a non-problem.
  const weakestActivity = [...breakdown.byActivityCategory]
    .filter((row) => row.heldEvents > 0)
    .sort((a, b) => a.attendanceRate - b.attendanceRate)[0];
  if (weakestActivity && weakestActivity.attendanceRate <= LOW_ATTENDANCE_THRESHOLD) {
    insights.push({
      id: 'activity-low-turnout',
      severity: 'warning',
      category: 'participation',
      title: `${weakestActivity.label} events have the weakest turnout`,
      detail: `${weakestActivity.attendanceRate}% attendance across ${weakestActivity.heldEvents} held event(s) and ${weakestActivity.registrations} registration(s).`,
      recommendation: 'Review timing, location and advance notice for this activity type before scheduling the next one.',
      metric: `${weakestActivity.attendanceRate}% attendance`,
    });
  }

  // ── Membership pipeline ────────────────────────────────────
  const pending = members.filter((m) => m.status.name === 'pending').length;
  if (pending > 0) {
    insights.push({
      id: 'pending-approvals',
      severity: pending >= 10 ? 'warning' : 'info',
      category: 'membership',
      title: `${pending} membership${pending === 1 ? '' : 's'} awaiting approval`,
      detail: `${pending} member${pending === 1 ? ' is' : 's are'} still pending review and cannot yet participate in events.`,
      recommendation: 'Clear the Pending Approvals queue so these members can register for upcoming activities.',
      metric: `${pending} pending`,
    });
  }

  // ── Budget: both sides, genuinely attributed ───────────────
  // Before 2026-09-16 only income could be attributed (Payment → Member → School);
  // `Expense` had no school/event FK at all, so this section was income-only. The
  // attribution migration made the brief's "which school or activity has the highest
  // expenses" and "compare spending between schools" actually derivable.
  const incomeBySchool = sumByDimension(payments, (p) => p.member.school, UNASSIGNED_SCHOOL);
  const expenseByCategory = sumByDimension(
    expenses,
    // Controlled category first, falling back to the legacy free-text label so rows
    // predating the vocabulary still appear instead of silently dropping out.
    (e) => e.expenseCategory ?? (e.category?.trim() ? { id: e.category.trim(), name: e.category.trim() } : null),
    UNCATEGORIZED,
  );
  const expenseBySchool = sumByDimension(expenses, (e) => e.school, COUNCIL_WIDE);
  const expenseByEvent = sumByDimension(
    expenses,
    (e) => (e.event ? { id: e.event.id, name: e.event.title } : null),
    COUNCIL_WIDE,
  );

  // Income and spending per school, so the two sides can actually be compared. Only
  // real schools appear — the unattributed buckets on either side are not a school and
  // would make a meaningless "net" row.
  const schoolFinance = buildSchoolFinance(incomeBySchool, expenseBySchool);

  const topExpense = expenseByCategory[0];
  if (topExpense && expenseByCategory.length > 1) {
    insights.push({
      id: 'expense-concentration',
      severity: 'info',
      category: 'budget',
      title: `${topExpense.label} is the largest spending category`,
      detail: `${topExpense.share}% of all recorded spending in range.`,
      recommendation: 'Confirm this allocation matches council priorities for the period.',
      metric: `${topExpense.share}% of spend`,
    });
  }

  // Which school costs the most to run relative to what it brings in — the brief's
  // "which school or activity has the highest expenses" / "areas that should receive
  // more budget" question, now answerable rather than deferred.
  const deepestDeficit = [...schoolFinance].sort((a, b) => a.net - b.net)[0];
  if (deepestDeficit && deepestDeficit.net < 0) {
    insights.push({
      id: 'school-net-deficit',
      severity: 'warning',
      category: 'budget',
      title: `${deepestDeficit.label} costs more than it brings in`,
      detail: `${formatAmount(deepestDeficit.expense)} spent against ${formatAmount(deepestDeficit.income)} collected — a net of ${formatAmount(deepestDeficit.net)} in range.`,
      recommendation: 'Review whether this reflects a deliberate investment or a fee-collection gap worth chasing.',
      metric: `${formatAmount(deepestDeficit.net)} net`,
    });
  }

  const topEventSpend = expenseByEvent.filter((row) => row.id !== 'unassigned')[0];
  if (topEventSpend) {
    insights.push({
      id: 'event-spend-concentration',
      severity: 'info',
      category: 'budget',
      title: `${topEventSpend.label} is the most expensive activity`,
      detail: `${formatAmount(topEventSpend.amount)} of attributed spending, ${topEventSpend.share}% of all spending in range.`,
      recommendation: 'Weigh this against the activity’s turnout before budgeting the next one.',
      metric: `${formatAmount(topEventSpend.amount)}`,
    });
  }

  // ── Promotion readiness ────────────────────────────────────
  // Point-in-time only: `Membership` records renewal, not level changes, so there is
  // still no promotion *history* to trend. What is derivable since 2026-09-16 is who
  // has aged past their current level's structured band.
  const promotionReadiness = buildPromotionReadiness(members, scoutLevels);
  const dueForPromotion = promotionReadiness.reduce((sum, row) => sum + row.overAge, 0);
  if (dueForPromotion > 0) {
    const worst = [...promotionReadiness].sort((a, b) => b.overAge - a.overAge)[0]!;
    insights.push({
      id: 'promotion-due',
      severity: 'warning',
      category: 'membership',
      title: `${dueForPromotion} member${dueForPromotion === 1 ? ' has' : 's have'} aged past their level`,
      detail: `${worst.overAge} in ${worst.levelName} alone${worst.nextLevelName ? `, who should move up to ${worst.nextLevelName}` : ''}.`,
      recommendation: 'Review these members for promotion so their level reflects their age.',
      metric: `${dueForPromotion} due`,
    });
  }

  // Most severe first, so the reader sees what actually needs a decision.
  const severityOrder: Record<InsightDto['severity'], number> = { critical: 0, warning: 1, info: 2 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    insights,
    suppressed,
    incomeBySchool,
    expenseByCategory,
    expenseBySchool,
    expenseByEvent,
    schoolFinance,
    promotionReadiness,
  };
}

/** Sums money rows by a nullable named dimension, returning each slice's share of the
 * total. Rows whose dimension is null land in an explicit bucket (`unassigned`) rather
 * than being dropped — unattributed spending is a real, reportable category, and
 * hiding it would make the percentages lie. */
function sumByDimension<T extends { amount: { toNumber(): number } }>(
  rows: T[],
  pick: (row: T) => NamedRef,
  unassignedLabel: string,
): MoneySliceDto[] {
  const groups = new Map<string, { label: string; amount: number }>();

  for (const row of rows) {
    const ref = pick(row);
    const id = ref?.id ?? 'unassigned';
    const group = groups.get(id) ?? { label: ref?.name ?? unassignedLabel, amount: 0 };
    group.amount += row.amount.toNumber();
    groups.set(id, group);
  }

  const total = Array.from(groups.values()).reduce((sum, g) => sum + g.amount, 0);

  return Array.from(groups.entries())
    .map(([id, group]) => ({ id, label: group.label, amount: group.amount, share: share(group.amount, total) }))
    .sort((a, b) => b.amount - a.amount);
}

/** Joins the income and expense sides per school. Only real schools appear: the
 * unattributed bucket exists on both sides but is not a school, so netting it would
 * produce a row that compares nothing. */
function buildSchoolFinance(income: MoneySliceDto[], expense: MoneySliceDto[]): SchoolFinanceRowDto[] {
  const byId = new Map<string, SchoolFinanceRowDto>();

  const ensure = (id: string, label: string) => {
    let row = byId.get(id);
    if (!row) {
      row = { id, label, income: 0, expense: 0, net: 0 };
      byId.set(id, row);
    }
    return row;
  };

  for (const slice of income) {
    if (slice.id === 'unassigned') continue;
    ensure(slice.id, slice.label).income += slice.amount;
  }
  for (const slice of expense) {
    if (slice.id === 'unassigned') continue;
    ensure(slice.id, slice.label).expense += slice.amount;
  }

  return Array.from(byId.values())
    .map((row) => ({ ...row, net: row.income - row.expense }))
    .sort((a, b) => b.expense - a.expense);
}

/** Whole years old at `on`, or null when no birth date is recorded. */
function ageOn(birthDate: Date, on: Date): number {
  let age = on.getFullYear() - birthDate.getFullYear();
  const monthDelta = on.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && on.getDate() < birthDate.getDate())) age -= 1;
  return age;
}

/**
 * Counts members who have aged past their current level's `maxAge`. Skips members with
 * no birth date and levels with no upper bound — both are missing information, and
 * treating a missing bound as 0 would flag the entire level as over-age.
 *
 * This is deliberately a *readiness* check, not a promotion trend: `Membership` records
 * renewal, not level changes, so the database holds no history of who moved when.
 */
function buildPromotionReadiness(members: MemberRow[], levels: ScoutLevelRow[]): PromotionReadinessRowDto[] {
  const today = new Date();
  const ordered = [...levels].sort((a, b) => a.orderNumber - b.orderNumber);

  return ordered
    .filter((level) => level.maxAge !== null)
    .map((level, index) => {
      const levelMembers = members.filter((m) => m.scoutLevel?.id === level.id);
      const overAge = levelMembers.filter((m) => m.birthDate !== null && ageOn(m.birthDate, today) > level.maxAge!).length;

      return {
        levelId: level.id,
        levelName: level.name,
        overAge,
        memberCount: levelMembers.length,
        nextLevelName: ordered[index + 1]?.name ?? null,
      };
    })
    .filter((row) => row.memberCount > 0);
}

/** Peso amounts inside insight prose. The UI formats its own currency; this exists so
 * a `detail` string reads as money rather than a bare number. */
function formatAmount(value: number): string {
  return `₱${Math.round(value).toLocaleString('en-PH')}`;
}

/** Council-wide badges per member — the baseline a weak level is compared against,
 * so the insight states a gap rather than a bare number. */
function councilBadgesPerMember(members: MemberRow[], breakdown: BreakdownAnalyticsDto): number {
  const totalBadges = breakdown.byLevel.reduce((sum, row) => sum + row.badgesEarned, 0);
  return members.length > 0 ? round1(totalBadges / members.length) : 0;
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
    const [
      members,
      events,
      badgeCatalog,
      memberBadges,
      troops,
      orgMembers,
      orgEvents,
      orgMemberBadges,
      paymentsSince,
      expensesSince,
      scoutLevels,
    ] = await Promise.all([
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
        analyticsRepository.listScoutLevels(),
      ]);

    // Breakdowns follow the page's troop scope (unlike Organization, which is the
    // troop comparison itself) — a Troop Leader-scoped or single-troop view should
    // see its own schools/levels, not the council's.
    const breakdown = buildBreakdownAnalytics(members, events, badgeCatalog, memberBadges);

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
      breakdown,
      decisionSupport: buildDecisionSupport(breakdown, members, paymentsSince, expensesSince, scoutLevels),
      generatedAt: new Date().toISOString(),
    };
  },
};
