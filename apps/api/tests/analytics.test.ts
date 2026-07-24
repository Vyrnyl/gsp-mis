import { beforeEach, describe, expect, it, vi } from 'vitest';

import { analyticsRepository } from '../src/modules/analytics/analytics.repository';
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

function mockRepository() {
  vi.spyOn(analyticsRepository, 'listMembers').mockResolvedValue(MEMBERS as never);
  vi.spyOn(analyticsRepository, 'listEventsWithDetail').mockResolvedValue(EVENTS as never);
  vi.spyOn(analyticsRepository, 'listBadgeCatalog').mockResolvedValue(BADGE_CATALOG as never);
  vi.spyOn(analyticsRepository, 'listMemberBadges').mockResolvedValue(MEMBER_BADGES as never);
  vi.spyOn(analyticsRepository, 'listTroops').mockResolvedValue(TROOPS as never);
  vi.spyOn(analyticsRepository, 'totalIncome').mockResolvedValue({ _sum: { amount: decimal(2100) } } as never);
  vi.spyOn(analyticsRepository, 'totalExpenses').mockResolvedValue({ _sum: { amount: decimal(20500) } } as never);
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
    const result = await analyticsService.getOverview();

    expect(result.membership.stats).toEqual([
      { id: 'totalMembers', label: 'Total Members', value: 3 },
      { id: 'active', label: 'Active', value: 2 },
      { id: 'pending', label: 'Pending', value: 1 },
      { id: 'newThisPeriod', label: 'New (6 mo.)', value: 2 },
    ]);
    expect(result.membership.trend).toHaveLength(6);
    expect(result.membership.trend.at(-1)).toMatchObject({ value: 2 });
  });

  it('excludes events with no attendance records from Events Held and computes the rate', async () => {
    const result = await analyticsService.getOverview();

    expect(result.attendance.stats).toEqual([
      { id: 'eventsHeld', label: 'Events Held', value: 1 },
      { id: 'avgRate', label: 'Avg. Attendance Rate', value: '67%' },
      { id: 'totalPresent', label: 'Total Present', value: 2 },
      { id: 'totalAbsent', label: 'Total Absent', value: 1 },
    ]);
  });

  it('excludes events with no registrations from participation and rounds the per-event average', async () => {
    const result = await analyticsService.getOverview();

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
    const result = await analyticsService.getOverview();

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

  it('computes financial stats and a 6-month income/expense trend', async () => {
    const result = await analyticsService.getOverview();

    expect(result.financial.stats).toEqual([
      { id: 'income', label: 'Total Income', value: 2100 },
      { id: 'expenses', label: 'Total Expenses', value: 20500 },
      { id: 'balance', label: 'Council Balance', value: -18400 },
    ]);
    expect(result.financial.trend).toHaveLength(6);
    expect(result.financial.trend.at(-1)).toMatchObject({ income: 350, expense: 12500 });
  });

  it('computes per-troop performance and the org-wide top attendance rate', async () => {
    const result = await analyticsService.getOverview();

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
