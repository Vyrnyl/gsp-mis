import { beforeEach, describe, expect, it, vi } from 'vitest';

import { analyticsRepository } from '../src/modules/analytics/analytics.repository';
import { overviewQuerySchema } from '../src/modules/analytics/analytics.schema';
import { analyticsService } from '../src/modules/analytics/analytics.service';

function decimal(value: number) {
  return { toNumber: () => value };
}

const NOW = new Date();
const THIS_MONTH = new Date(NOW.getFullYear(), NOW.getMonth(), 15);

const TROOP_A = { id: 'troop-a', name: 'Troop 12 — Virac' };
const TROOP_B = { id: 'troop-b', name: 'Troop 4 — Bato' };

const MEMBERS = [
  { id: 'm-1', createdAt: THIS_MONTH, troopId: TROOP_A.id, status: { name: 'active' } },
  { id: 'm-2', createdAt: THIS_MONTH, troopId: TROOP_A.id, status: { name: 'pending' } },
  { id: 'm-3', createdAt: new Date('2020-01-01T00:00:00Z'), troopId: TROOP_B.id, status: { name: 'active' } },
];

const EVENTS = [
  {
    id: 'evt-1',
    title: 'Coastal Clean-Up Drive',
    eventDate: THIS_MONTH,
    registrations: [{ id: 'r-1' }, { id: 'r-2' }],
    attendanceRecords: [
      { attendanceStatus: 'present', member: { troopId: TROOP_A.id } },
      { attendanceStatus: 'present', member: { troopId: TROOP_A.id } },
      { attendanceStatus: 'absent', member: { troopId: TROOP_B.id } },
    ],
  },
  {
    // No registrations and no attendance yet — an upcoming event that should not
    // count toward "events held" or the participation chart.
    id: 'evt-2',
    title: 'Upcoming Council Camp',
    eventDate: THIS_MONTH,
    registrations: [],
    attendanceRecords: [],
  },
];

const BADGE_CATALOG = [
  { id: 'b-1', name: 'Community Helper' },
  { id: 'b-2', name: 'Camp Cook' },
];

const MEMBER_BADGES = [
  { id: 'mb-1', badgeId: 'b-1', status: 'earned', member: { troopId: TROOP_A.id } },
  { id: 'mb-2', badgeId: 'b-1', status: 'verified', member: { troopId: TROOP_B.id } },
  { id: 'mb-3', badgeId: 'b-2', status: 'in_progress', member: { troopId: TROOP_A.id } },
];

const TROOPS = [TROOP_A, TROOP_B];

/** Default filters — the pre-revision behavior (6 months, all troops), so the
 * existing assertions below keep testing exactly what they always did. */
const DEFAULT_QUERY = { range: '6m', troopId: undefined } as const;

function mockRepository() {
  vi.spyOn(analyticsRepository, 'listMembers').mockResolvedValue(MEMBERS as never);
  vi.spyOn(analyticsRepository, 'listEventsWithDetail').mockResolvedValue(EVENTS as never);
  vi.spyOn(analyticsRepository, 'listBadgeCatalog').mockResolvedValue(BADGE_CATALOG as never);
  vi.spyOn(analyticsRepository, 'listMemberBadges').mockResolvedValue(MEMBER_BADGES as never);
  vi.spyOn(analyticsRepository, 'listTroops').mockResolvedValue(TROOPS as never);
  vi.spyOn(analyticsRepository, 'paymentsSince').mockResolvedValue([
    { paymentDate: THIS_MONTH, amount: decimal(350) },
  ] as never);
  vi.spyOn(analyticsRepository, 'expensesSince').mockResolvedValue([
    { expenseDate: THIS_MONTH, amount: decimal(12500) },
  ] as never);
}

describe('analyticsService.getOverview', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('computes membership stats and a 6-month trend', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.membership.stats).toEqual([
      { id: 'totalMembers', label: 'Total Members', value: 3 },
      { id: 'active', label: 'Active', value: 2 },
      { id: 'pending', label: 'Pending', value: 1 },
      { id: 'newThisPeriod', label: 'New (in range)', value: 2 },
    ]);
    expect(result.membership.trend).toHaveLength(6);
    expect(result.membership.trend.at(-1)).toMatchObject({ value: 2 });
  });

  it('excludes events with no attendance records from Events Held and computes the rate', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.attendance.stats).toEqual([
      { id: 'eventsHeld', label: 'Events Held', value: 1 },
      { id: 'avgRate', label: 'Avg. Attendance Rate', value: '67%' },
      { id: 'totalPresent', label: 'Total Present', value: 2 },
      { id: 'totalAbsent', label: 'Total Absent', value: 1 },
    ]);
  });

  it('excludes events with no registrations from participation and rounds the per-event average', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.participation.stats).toEqual([
      { id: 'totalRegistrations', label: 'Total Registrations', value: 2 },
      { id: 'avgPerEvent', label: 'Avg. Registrants / Event', value: 2 },
      { id: 'avgAttendanceRate', label: 'Avg. Attendance Rate', value: '67%' },
    ]);
    expect(result.participation.byEvent).toEqual([
      { eventId: 'evt-1', eventTitle: 'Coastal Clean-Up Drive', registrations: 2, attendanceRate: 67 },
    ]);
  });

  it('computes badge completion rate relative to total members, including a 0% badge', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.badges.stats).toEqual([
      { id: 'totalAwarded', label: 'Badges Awarded', value: 2 },
      { id: 'verified', label: 'Verified', value: 1 },
      { id: 'inProgress', label: 'In Progress', value: 1 },
    ]);
    expect(result.badges.completionByBadge).toEqual([
      { badgeId: 'b-1', badgeName: 'Community Helper', completionRate: 67 },
      { badgeId: 'b-2', badgeName: 'Camp Cook', completionRate: 0 },
    ]);
  });

  // Post-revision semantics: the stat cards sum the *same in-range rows* that build
  // the trend, rather than reading all-time aggregates. Previously these asserted
  // 2100/20500 (lifetime totals) above a 6-month chart of 350/12500.
  it('sums financial stats from the in-range rows so they agree with the trend', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.financial.stats).toEqual([
      { id: 'income', label: 'Income (in range)', value: 350 },
      { id: 'expenses', label: 'Expenses (in range)', value: 12500 },
      { id: 'balance', label: 'Net (in range)', value: -12150 },
    ]);
    expect(result.financial.trend).toHaveLength(6);
    expect(result.financial.trend.at(-1)).toMatchObject({ income: 350, expense: 12500 });
  });

  it('computes per-troop performance and the org-wide top attendance rate', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.organization.stats).toEqual([
      { id: 'totalTroops', label: 'Total Troops', value: 2 },
      { id: 'avgMembersPerTroop', label: 'Avg. Members / Troop', value: 2 },
      { id: 'topAttendanceRate', label: 'Top Attendance Rate', value: '100%' },
    ]);
    expect(result.organization.troops).toEqual([
      { troopId: TROOP_A.id, troopName: TROOP_A.name, memberCount: 2, attendanceRate: 100, badgesEarned: 1 },
      { troopId: TROOP_B.id, troopName: TROOP_B.name, memberCount: 1, attendanceRate: 0, badgesEarned: 1 },
    ]);
  });
});

/** The 2026-09-02 filter revision. */
describe('analyticsService.getOverview — filters', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('sizes every trend to the selected range', async () => {
    const threeMonths = await analyticsService.getOverview({ range: '3m', troopId: undefined });
    expect(threeMonths.membership.trend).toHaveLength(3);
    expect(threeMonths.attendance.trend).toHaveLength(3);
    expect(threeMonths.financial.trend).toHaveLength(3);

    const twelveMonths = await analyticsService.getOverview({ range: '12m', troopId: undefined });
    expect(twelveMonths.membership.trend).toHaveLength(12);
    expect(twelveMonths.financial.trend).toHaveLength(12);
  });

  it('sizes the "this year" range to the number of elapsed calendar months', async () => {
    const result = await analyticsService.getOverview({ range: 'ytd', troopId: undefined });
    expect(result.membership.trend).toHaveLength(new Date().getMonth() + 1);
  });

  it('labels 12-month buckets with the year so repeated month names stay distinct', async () => {
    const result = await analyticsService.getOverview({ range: '12m', troopId: undefined });
    const labels = result.membership.trend.map((point) => point.label);

    expect(new Set(labels).size).toBe(12);
    // e.g. "Sep 25" — short month plus 2-digit year.
    labels.forEach((label) => expect(label).toMatch(/^[A-Z][a-z]{2} \d{2}$/));
  });

  it('keeps 6-month bucket labels bare, since they cannot repeat a month', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);
    result.membership.trend.forEach((point) => expect(point.label).toMatch(/^[A-Z][a-z]{2}$/));
  });

  it('pushes the range cutoff and troop filter down into the repository', async () => {
    await analyticsService.getOverview({ range: '3m', troopId: TROOP_A.id });

    expect(analyticsRepository.listMembers).toHaveBeenCalledWith(TROOP_A.id);
    expect(analyticsRepository.listMemberBadges).toHaveBeenCalledWith(TROOP_A.id);

    const expectedCutoff = new Date(NOW.getFullYear(), NOW.getMonth() - 2, 1);
    expect(analyticsRepository.paymentsSince).toHaveBeenCalledWith(expectedCutoff);
    expect(analyticsRepository.listEventsWithDetail).toHaveBeenCalledWith(expectedCutoff, TROOP_A.id);
  });

  it('builds the Organization tab from unscoped rows even when a troop is selected', async () => {
    const result = await analyticsService.getOverview({ range: '6m', troopId: TROOP_A.id });

    // Both troops still present — scoping this tab to one troop would collapse the
    // only view that answers "how do troops compare?".
    expect(result.organization.troops).toHaveLength(2);

    // Two fetches: one scoped to the selected troop for the other five tabs, and a
    // second unscoped one (called with no argument) that feeds this tab.
    expect(analyticsRepository.listMembers).toHaveBeenCalledTimes(2);
    expect(analyticsRepository.listMembers).toHaveBeenNthCalledWith(1, TROOP_A.id);
    expect(analyticsRepository.listMembers).toHaveBeenNthCalledWith(2);
  });

  it('does not double-fetch for the Organization tab when no troop is selected', async () => {
    await analyticsService.getOverview(DEFAULT_QUERY);

    // The unscoped rows are already the scoped rows, so the extra org-only queries
    // must be skipped rather than run twice for identical results.
    expect(analyticsRepository.listMembers).toHaveBeenCalledTimes(1);
    expect(analyticsRepository.listEventsWithDetail).toHaveBeenCalledTimes(1);
    expect(analyticsRepository.listMemberBadges).toHaveBeenCalledTimes(1);
  });

  it('does not scope council finances by troop', async () => {
    await analyticsService.getOverview({ range: '6m', troopId: TROOP_A.id });

    // `Expense` has no troop association in the schema at all, so the repository
    // takes no troopId here — the UI disables the filter on that tab to match.
    expect(analyticsRepository.paymentsSince).toHaveBeenCalledWith(expect.any(Date));
    expect(analyticsRepository.expensesSince).toHaveBeenCalledWith(expect.any(Date));
  });
});

describe('overviewQuerySchema', () => {
  it('defaults to a 6-month, all-troops view when nothing is supplied', () => {
    const result = overviewQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ range: '6m', troopId: undefined });
  });

  it('rejects an unknown range rather than silently falling back', () => {
    expect(overviewQuerySchema.safeParse({ range: '24m' }).success).toBe(false);
  });

  it('rejects a non-uuid troopId', () => {
    expect(overviewQuerySchema.safeParse({ range: '6m', troopId: 'all' }).success).toBe(false);
  });

  it('treats an empty troopId as no filter', () => {
    const result = overviewQuerySchema.safeParse({ range: '6m', troopId: '' });
    expect(result.success).toBe(true);
    expect(result.data?.troopId).toBeUndefined();
  });
});
