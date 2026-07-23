import type { RoleName } from '../../shared/constants/roles';
import type { MemberStatusName } from '../members/members.schema';

/**
 * `GET /api/v1/dashboard` response contract (build-plan.md §1.5). No request body or
 * query — the role comes from `req.user` (set by `requireAuth` from the verified
 * access token), never a client parameter (settled decision #4).
 */

/** A stat card's raw number. Icon/tone are presentation-only and stay frontend-side
 *  (`features/dashboard/constants.ts` maps `id` → icon/tone per role). */
export interface DashboardStatDto {
  id: string;
  label: string;
  value: number;
}

/** One bar in the membership-growth chart. */
export interface GrowthPointDto {
  label: string;
  count: number;
}

/** One donut segment. */
export interface StatusSliceDto {
  status: MemberStatusName;
  label: string;
  count: number;
}

export type ActivityTone = 'green' | 'gold' | 'blue' | 'red';

export interface ActivityEntryDto {
  id: string;
  tone: ActivityTone;
  text: string;
  /** ISO timestamp — the frontend formats this as relative time ("2 hours ago"). */
  occurredAt: string;
}

export interface TroopOverviewDto {
  id: string;
  troopCode: string;
  name: string;
  memberCount: number;
  leaderName: string | null;
  /** Derived from `Troop.leaderId !== null` — the schema has no separate troop
   *  lifecycle status, so "active" here means "has an assigned leader" (1.6's
   *  Organization Management owns troop CRUD and may add a real status later). */
  hasLeader: boolean;
}

export interface ScoutLevelShareDto {
  id: string;
  levelName: string;
  count: number;
  percent: number;
}

export interface RosterRowDto {
  id: string;
  name: string;
  scoutLevelName: string | null;
  status: MemberStatusName;
}

export interface AdminDashboardResponseBody {
  role: 'admin';
  stats: DashboardStatDto[];
  growth: GrowthPointDto[];
  statusBreakdown: StatusSliceDto[];
  recentActivity: ActivityEntryDto[];
  troops: TroopOverviewDto[];
}

export interface CouncilDashboardResponseBody {
  role: 'executive_council';
  stats: DashboardStatDto[];
  troops: TroopOverviewDto[];
  scoutLevelBreakdown: ScoutLevelShareDto[];
}

export interface TroopDashboardResponseBody {
  role: 'troop_leader';
  troopName: string;
  troopCode: string;
  stats: DashboardStatDto[];
  roster: RosterRowDto[];
  scoutLevelBreakdown: ScoutLevelShareDto[];
}

export type DashboardResponseBody =
  | AdminDashboardResponseBody
  | CouncilDashboardResponseBody
  | TroopDashboardResponseBody;

/** Narrows `RoleName` down to the three the dashboard actually branches on — every
 *  seeded role, so this is exhaustive today but stays explicit if that ever changes. */
export type DashboardRole = Extract<RoleName, 'admin' | 'executive_council' | 'troop_leader'>;
