import { dashboardRepository } from './dashboard.repository';
import type {
  ActivityEntryDto,
  AdminDashboardResponseBody,
  CouncilDashboardResponseBody,
  DashboardRole,
  DashboardResponseBody,
  DashboardStatDto,
  GrowthPointDto,
  RosterRowDto,
  ScoutLevelShareDto,
  StatusSliceDto,
  TroopDashboardResponseBody,
  TroopOverviewDto,
} from './dashboard.types';
import type { MemberStatusName } from '../members/members.schema';

/** Fixed display order + labels for the status donut — mirrors
 *  `MEMBER_STATUS_LABELS` in `apps/web/src/features/members/constants.ts`. */
const STATUS_LABELS: Record<MemberStatusName, string> = {
  active: 'Active',
  pending: 'Pending Review',
  expiring: 'Expiring Soon',
  expired: 'Expired',
  rejected: 'Rejected',
  archived: 'Archived',
};
const STATUS_ORDER: MemberStatusName[] = ['active', 'pending', 'expiring', 'expired', 'rejected', 'archived'];

function sixMonthsAgo(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 5, 1);
}

/** Last 6 calendar months, oldest first, bucketed from a flat `createdAt` list. */
function buildGrowthPoints(createdDates: Date[]): GrowthPointDto[] {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (5 - i), 1));
  const points = months.map((month) => ({
    label: month.toLocaleString('en-US', { month: 'short' }),
    count: 0,
    key: `${month.getFullYear()}-${month.getMonth()}`,
  }));

  for (const createdAt of createdDates) {
    const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
    const bucket = points.find((point) => point.key === key);
    if (bucket) bucket.count += 1;
  }

  return points.map(({ label, count }) => ({ label, count }));
}

function buildStatusBreakdown(rows: Array<{ name: string; _count: { members: number } }>): StatusSliceDto[] {
  return STATUS_ORDER.filter((status) => rows.some((row) => row.name === status && row._count.members > 0)).map(
    (status) => ({
      status,
      label: STATUS_LABELS[status],
      count: rows.find((row) => row.name === status)!._count.members,
    }),
  );
}

async function buildRecentActivity(): Promise<ActivityEntryDto[]> {
  const [registrations, logs] = await Promise.all([
    dashboardRepository.recentMemberRegistrations(5),
    dashboardRepository.recentAuditLogs(5),
  ]);

  const referencedIds = logs.map((log) => log.entityId).filter((id): id is string => Boolean(id));
  const referencedMembers = referencedIds.length > 0 ? await dashboardRepository.findMembersByIds(referencedIds) : [];
  const memberById = new Map(referencedMembers.map((member) => [member.id, member]));

  const registrationEntries: ActivityEntryDto[] = registrations.map((member) => ({
    id: `reg-${member.id}`,
    tone: 'blue',
    text: `New ${member.memberType === 'scout' ? 'scout' : 'adult leader'} registered — ${member.troop?.name ?? 'Unassigned troop'}`,
    occurredAt: member.createdAt.toISOString(),
  }));

  const auditEntries: ActivityEntryDto[] = logs.map((log) => {
    const member = log.entityId ? memberById.get(log.entityId) : undefined;
    const name = member ? `${member.firstName} ${member.lastName}` : 'A member';
    const approved = log.action === 'member.approve';
    return {
      id: `log-${log.id}`,
      tone: approved ? 'green' : 'red',
      text: `${name}'s registration was ${approved ? 'approved' : 'rejected'}`,
      occurredAt: log.createdAt.toISOString(),
    };
  });

  return [...registrationEntries, ...auditEntries]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 5);
}

async function buildTroopsOverview(): Promise<TroopOverviewDto[]> {
  const troops = await dashboardRepository.listTroopsWithLeaderAndCount();
  return troops.map((troop) => ({
    id: troop.id,
    troopCode: troop.troopCode,
    name: troop.name,
    memberCount: troop._count.members,
    leaderName: troop.leader?.fullName ?? null,
    hasLeader: troop.leaderId !== null,
  }));
}

async function buildOrgScoutLevelBreakdown(): Promise<ScoutLevelShareDto[]> {
  const levels = await dashboardRepository.scoutLevelBreakdown();
  const total = levels.reduce((sum, level) => sum + level._count.members, 0);
  return levels
    .filter((level) => level._count.members > 0)
    .map((level) => ({
      id: level.id,
      levelName: level.name,
      count: level._count.members,
      percent: total > 0 ? Math.round((level._count.members / total) * 100) : 0,
    }));
}

async function getAdminDashboard(): Promise<AdminDashboardResponseBody> {
  const [councilsCount, troopsCount, membersCount, pendingCount, statusRows, createdSince, recentActivity, troops] =
    await Promise.all([
      dashboardRepository.countCouncils(),
      dashboardRepository.countTroops(),
      dashboardRepository.countMembers(),
      dashboardRepository.countMembersByStatus('pending'),
      dashboardRepository.statusBreakdown(),
      dashboardRepository.membersCreatedSince(sixMonthsAgo()),
      buildRecentActivity(),
      buildTroopsOverview(),
    ]);

  const stats: DashboardStatDto[] = [
    { id: 'councils', label: 'Active Councils', value: councilsCount },
    { id: 'troops', label: 'Total Troops', value: troopsCount },
    { id: 'members', label: 'Total Members', value: membersCount },
    { id: 'pending', label: 'Pending Approvals', value: pendingCount },
  ];

  return {
    role: 'admin',
    stats,
    growth: buildGrowthPoints(createdSince.map((row) => row.createdAt)),
    statusBreakdown: buildStatusBreakdown(statusRows),
    recentActivity,
    troops,
  };
}

/**
 * `User` has no `councilId` — there's exactly one council in the schema/seed today,
 * so this reads the same council-wide data `getAdminDashboard` does, minus the
 * "Active Councils" stat which doesn't mean anything at council scope. Revisit once
 * 1.6 supports multiple councils with a real per-user council assignment.
 */
async function getCouncilDashboard(): Promise<CouncilDashboardResponseBody> {
  const [troopsCount, membersCount, pendingCount, activeCount, troops, scoutLevelBreakdown] = await Promise.all([
    dashboardRepository.countTroops(),
    dashboardRepository.countMembers(),
    dashboardRepository.countMembersByStatus('pending'),
    dashboardRepository.countMembersByStatus('active'),
    buildTroopsOverview(),
    buildOrgScoutLevelBreakdown(),
  ]);

  const stats: DashboardStatDto[] = [
    { id: 'troops', label: 'Troops in Council', value: troopsCount },
    { id: 'members', label: 'Total Members', value: membersCount },
    { id: 'pending', label: 'Pending Approvals', value: pendingCount },
    { id: 'active', label: 'Active Members', value: activeCount },
  ];

  return { role: 'executive_council', stats, troops, scoutLevelBreakdown };
}

async function getTroopLeaderDashboard(leaderId: string): Promise<TroopDashboardResponseBody> {
  const troop = await dashboardRepository.findTroopByLeaderId(leaderId);

  if (!troop) {
    // A troop leader who signed up but hasn't been assigned a troop yet (1.6 does
    // the assignment) — the "no troop" empty state the mock step already drew.
    return {
      role: 'troop_leader',
      troopName: 'No Troop Assigned',
      troopCode: '—',
      stats: [
        { id: 'members', label: 'Troop Members', value: 0 },
        { id: 'active', label: 'Active', value: 0 },
        { id: 'pending', label: 'Pending Review', value: 0 },
        { id: 'levels', label: 'Scout Levels', value: 0 },
      ],
      roster: [],
      scoutLevelBreakdown: [],
    };
  }

  const roster = await dashboardRepository.listTroopRoster(troop.id);

  const rosterRows: RosterRowDto[] = roster.map((member) => ({
    id: member.id,
    name: `${member.firstName} ${member.lastName}`,
    scoutLevelName: member.scoutLevel?.name ?? null,
    status: member.status.name as MemberStatusName,
  }));

  const activeCount = roster.filter((member) => member.status.name === 'active').length;
  const pendingCount = roster.filter((member) => member.status.name === 'pending').length;
  const levelCounts = new Map<string, { levelName: string; count: number }>();
  for (const member of roster) {
    if (!member.scoutLevel) continue;
    const existing = levelCounts.get(member.scoutLevel.id);
    if (existing) existing.count += 1;
    else levelCounts.set(member.scoutLevel.id, { levelName: member.scoutLevel.name, count: 1 });
  }
  const leveledTotal = [...levelCounts.values()].reduce((sum, level) => sum + level.count, 0);
  const scoutLevelBreakdown: ScoutLevelShareDto[] = [...levelCounts.entries()].map(([id, level]) => ({
    id,
    levelName: level.levelName,
    count: level.count,
    percent: leveledTotal > 0 ? Math.round((level.count / leveledTotal) * 100) : 0,
  }));

  const stats: DashboardStatDto[] = [
    { id: 'members', label: 'Troop Members', value: roster.length },
    { id: 'active', label: 'Active', value: activeCount },
    { id: 'pending', label: 'Pending Review', value: pendingCount },
    { id: 'levels', label: 'Scout Levels', value: levelCounts.size },
  ];

  return {
    role: 'troop_leader',
    troopName: troop.name,
    troopCode: troop.troopCode,
    stats,
    roster: rosterRows,
    scoutLevelBreakdown,
  };
}

export const dashboardService = {
  /** Dispatches purely on the verified session's role/id — never a client param
   *  (settled decision #4, build-plan.md §1.5). */
  async getDashboard(userId: string, role: DashboardRole): Promise<DashboardResponseBody> {
    if (role === 'admin') return getAdminDashboard();
    if (role === 'executive_council') return getCouncilDashboard();
    return getTroopLeaderDashboard(userId);
  },
};
