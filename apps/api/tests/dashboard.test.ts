import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dashboardRepository } from '../src/modules/dashboard/dashboard.repository';
import { dashboardService } from '../src/modules/dashboard/dashboard.service';
import type { AdminDashboardResponseBody, CouncilDashboardResponseBody, TroopDashboardResponseBody } from '../src/modules/dashboard/dashboard.types';

const now = new Date('2026-07-23T10:00:00Z');

/** Uses the real current date (like `dashboard.service.ts`'s `buildGrowthPoints`
 *  does), not the fixed `now` above — so the "current month" bucket assertion holds
 *  regardless of what date the test suite actually runs on. */
function monthsAgo(months: number): Date {
  const real = new Date();
  return new Date(real.getFullYear(), real.getMonth() - months, 5);
}

const STATUS_ROWS = [
  { id: 's-active', name: 'active', description: null, _count: { members: 6 } },
  { id: 's-pending', name: 'pending', description: null, _count: { members: 2 } },
  { id: 's-expiring', name: 'expiring', description: null, _count: { members: 0 } },
  { id: 's-expired', name: 'expired', description: null, _count: { members: 0 } },
  { id: 's-rejected', name: 'rejected', description: null, _count: { members: 1 } },
  { id: 's-archived', name: 'archived', description: null, _count: { members: 1 } },
];

const TROOP_ROWS = [
  {
    id: 't1',
    councilId: 'c1',
    name: 'Troop 12 — Virac',
    troopCode: 'CAT-VIR-012',
    leaderId: 'leader-1',
    createdAt: now,
    updatedAt: now,
    leader: { id: 'leader-1', fullName: 'Fely Contreras' },
    _count: { members: 4 },
  },
  {
    id: 't2',
    councilId: 'c1',
    name: 'Troop 7 — San Andres',
    troopCode: 'CAT-SAN-007',
    leaderId: null,
    createdAt: now,
    updatedAt: now,
    leader: null,
    _count: { members: 3 },
  },
];

const SCOUT_LEVEL_ROWS = [
  { id: 'l1', name: 'Junior Girl Scout', description: null, orderNumber: 2, _count: { members: 3 } },
  { id: 'l2', name: 'Senior Girl Scout', description: null, orderNumber: 3, _count: { members: 1 } },
  { id: 'l3', name: 'Cadet Girl Scout', description: null, orderNumber: 4, _count: { members: 0 } },
];

describe('dashboardService.getDashboard — admin', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('aggregates org-wide stats, growth buckets, status breakdown and merged activity', async () => {
    vi.spyOn(dashboardRepository, 'countCouncils').mockResolvedValue(1);
    vi.spyOn(dashboardRepository, 'countTroops').mockResolvedValue(2);
    vi.spyOn(dashboardRepository, 'countMembers').mockResolvedValue(10);
    vi.spyOn(dashboardRepository, 'countMembersByStatus').mockResolvedValue(2);
    vi.spyOn(dashboardRepository, 'statusBreakdown').mockResolvedValue(STATUS_ROWS as never);
    vi.spyOn(dashboardRepository, 'membersCreatedSince').mockResolvedValue([
      { createdAt: monthsAgo(0) },
      { createdAt: monthsAgo(0) },
      { createdAt: monthsAgo(2) },
    ] as never);
    vi.spyOn(dashboardRepository, 'recentMemberRegistrations').mockResolvedValue([
      {
        id: 'm1',
        memberType: 'scout',
        createdAt: now,
        troop: { name: 'Troop 12 — Virac' },
      },
    ] as never);
    vi.spyOn(dashboardRepository, 'recentAuditLogs').mockResolvedValue([
      { id: 'log1', action: 'member.approve', entityId: 'm2', createdAt: new Date(now.getTime() - 3_600_000) },
    ] as never);
    vi.spyOn(dashboardRepository, 'findMembersByIds').mockResolvedValue([
      { id: 'm2', firstName: 'Grace', lastName: 'Villanueva' },
    ] as never);
    vi.spyOn(dashboardRepository, 'listTroopsWithLeaderAndCount').mockResolvedValue(TROOP_ROWS as never);

    const result = (await dashboardService.getDashboard('admin-1', 'admin')) as AdminDashboardResponseBody;

    expect(result.role).toBe('admin');
    expect(result.stats).toEqual([
      { id: 'councils', label: 'Active Councils', value: 1 },
      { id: 'troops', label: 'Total Troops', value: 2 },
      { id: 'members', label: 'Total Members', value: 10 },
      { id: 'pending', label: 'Pending Approvals', value: 2 },
    ]);
    // 6 buckets, current month holds the two `monthsAgo(0)` entries.
    expect(result.growth).toHaveLength(6);
    expect(result.growth.at(-1)).toMatchObject({ count: 2 });
    // Zero-count statuses (`expiring`/`expired`) are dropped, order follows STATUS_ORDER.
    expect(result.statusBreakdown).toEqual([
      { status: 'active', label: 'Active', count: 6 },
      { status: 'pending', label: 'Pending Review', count: 2 },
      { status: 'rejected', label: 'Rejected', count: 1 },
      { status: 'archived', label: 'Archived', count: 1 },
    ]);
    // Registration + audit-log activity merged and sorted newest first.
    expect(result.recentActivity).toHaveLength(2);
    expect(result.recentActivity[0]).toMatchObject({ tone: 'blue', text: expect.stringContaining('New scout registered') });
    expect(result.recentActivity[1]).toMatchObject({ tone: 'green', text: "Grace Villanueva's registration was approved" });
    expect(result.troops).toEqual([
      { id: 't1', troopCode: 'CAT-VIR-012', name: 'Troop 12 — Virac', memberCount: 4, leaderName: 'Fely Contreras', hasLeader: true },
      { id: 't2', troopCode: 'CAT-SAN-007', name: 'Troop 7 — San Andres', memberCount: 3, leaderName: null, hasLeader: false },
    ]);
  });
});

describe('dashboardService.getDashboard — executive_council', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('reads the same council-wide data as admin (single council today) plus scout-level composition', async () => {
    vi.spyOn(dashboardRepository, 'countTroops').mockResolvedValue(2);
    vi.spyOn(dashboardRepository, 'countMembers').mockResolvedValue(10);
    // Called in this order inside `getCouncilDashboard`'s `Promise.all` — 'pending' first, then 'active'.
    vi.spyOn(dashboardRepository, 'countMembersByStatus').mockResolvedValueOnce(2).mockResolvedValueOnce(6);
    vi.spyOn(dashboardRepository, 'listTroopsWithLeaderAndCount').mockResolvedValue(TROOP_ROWS as never);
    vi.spyOn(dashboardRepository, 'scoutLevelBreakdown').mockResolvedValue(SCOUT_LEVEL_ROWS as never);

    const result = (await dashboardService.getDashboard('council-1', 'executive_council')) as CouncilDashboardResponseBody;

    expect(result.role).toBe('executive_council');
    expect(result.stats).toEqual([
      { id: 'troops', label: 'Troops in Council', value: 2 },
      { id: 'members', label: 'Total Members', value: 10 },
      { id: 'pending', label: 'Pending Approvals', value: 2 },
      { id: 'active', label: 'Active Members', value: 6 },
    ]);
    // Zero-count level dropped; percent out of the 4 leveled members.
    expect(result.scoutLevelBreakdown).toEqual([
      { id: 'l1', levelName: 'Junior Girl Scout', count: 3, percent: 75 },
      { id: 'l2', levelName: 'Senior Girl Scout', count: 1, percent: 25 },
    ]);
    expect(result.troops).toHaveLength(2);
  });
});

describe('dashboardService.getDashboard — troop_leader', () => {
  beforeEach(() => vi.restoreAllMocks());

  it("builds the leader's own troop roster and scout-level breakdown", async () => {
    vi.spyOn(dashboardRepository, 'findTroopByLeaderId').mockResolvedValue({
      id: 't1',
      councilId: 'c1',
      name: 'Troop 12 — Virac',
      troopCode: 'CAT-VIR-012',
      leaderId: 'leader-1',
      createdAt: now,
      updatedAt: now,
    } as never);
    vi.spyOn(dashboardRepository, 'listTroopRoster').mockResolvedValue([
      { id: 'm1', firstName: 'Ana', lastName: 'Reyes', status: { name: 'active' }, scoutLevel: { id: 'l1', name: 'Junior Girl Scout' } },
      { id: 'm2', firstName: 'Carla', lastName: 'Dizon', status: { name: 'pending' }, scoutLevel: { id: 'l2', name: 'Star Scout' } },
      { id: 'm3', firstName: 'Fely', lastName: 'Contreras', status: { name: 'active' }, scoutLevel: null },
    ] as never);

    const result = (await dashboardService.getDashboard('leader-1', 'troop_leader')) as TroopDashboardResponseBody;

    expect(result.role).toBe('troop_leader');
    expect(result.troopName).toBe('Troop 12 — Virac');
    expect(result.stats).toEqual([
      { id: 'members', label: 'Troop Members', value: 3 },
      { id: 'active', label: 'Active', value: 2 },
      { id: 'pending', label: 'Pending Review', value: 1 },
      { id: 'levels', label: 'Scout Levels', value: 2 },
    ]);
    expect(result.roster).toEqual([
      { id: 'm1', name: 'Ana Reyes', scoutLevelName: 'Junior Girl Scout', status: 'active' },
      { id: 'm2', name: 'Carla Dizon', scoutLevelName: 'Star Scout', status: 'pending' },
      { id: 'm3', name: 'Fely Contreras', scoutLevelName: null, status: 'active' },
    ]);
    expect(result.scoutLevelBreakdown.sort((a, b) => a.levelName.localeCompare(b.levelName))).toEqual([
      { id: 'l1', levelName: 'Junior Girl Scout', count: 1, percent: 50 },
      { id: 'l2', levelName: 'Star Scout', count: 1, percent: 50 },
    ]);
  });

  it('returns the "no troop assigned" empty shape when self-signup has not been linked to a troop yet (1.6)', async () => {
    vi.spyOn(dashboardRepository, 'findTroopByLeaderId').mockResolvedValue(null);
    const listTroopRoster = vi.spyOn(dashboardRepository, 'listTroopRoster');

    const result = (await dashboardService.getDashboard('leader-2', 'troop_leader')) as TroopDashboardResponseBody;

    expect(result.troopName).toBe('No Troop Assigned');
    expect(result.troopCode).toBe('—');
    expect(result.roster).toEqual([]);
    expect(result.stats.every((stat) => stat.value === 0)).toBe(true);
    expect(listTroopRoster).not.toHaveBeenCalled();
  });
});
