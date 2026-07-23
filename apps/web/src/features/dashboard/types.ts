import type { MemberStatusId } from '@/features/members/types';

/**
 * Mirrors `apps/api/src/modules/dashboard/dashboard.types.ts` — the `GET
 * /api/v1/dashboard` contract. Icon and tone are deliberately absent here: they're
 * presentation-only and can't cross the wire (an `IconType` is a React component),
 * so `features/dashboard/constants.ts` maps each stat's `id` to an icon/tone per
 * role instead of the API dictating how a number should look.
 */

export interface DashboardStatValue {
  id: string;
  label: string;
  value: number;
}

/** One bar in the membership-growth chart — a month label + new registrations. */
export interface GrowthPoint {
  label: string;
  count: number;
}

/** One donut segment — a member status and its share of the total. */
export interface StatusSlice {
  status: MemberStatusId;
  label: string;
  count: number;
}

export type ActivityTone = 'green' | 'gold' | 'blue' | 'red';

export interface ActivityEntry {
  id: string;
  tone: ActivityTone;
  text: string;
  /** ISO timestamp — formatted client-side via `formatRelativeTime`. */
  occurredAt: string;
}

export interface TroopOverviewRow {
  id: string;
  troopCode: string;
  name: string;
  memberCount: number;
  leaderName: string | null;
  /** Derived from `Troop.leaderId !== null` — see `dashboard.types.ts` on the API side. */
  hasLeader: boolean;
}

export interface ScoutLevelShare {
  id: string;
  levelName: string;
  count: number;
  percent: number;
}

export interface RosterRow {
  id: string;
  name: string;
  scoutLevelName: string | null;
  status: MemberStatusId;
}

export interface AdminDashboardData {
  stats: DashboardStatValue[];
  growth: GrowthPoint[];
  statusBreakdown: StatusSlice[];
  recentActivity: ActivityEntry[];
  troops: TroopOverviewRow[];
}

export interface CouncilDashboardData {
  stats: DashboardStatValue[];
  troops: TroopOverviewRow[];
  scoutLevelBreakdown: ScoutLevelShare[];
}

export interface TroopDashboardData {
  troopName: string;
  troopCode: string;
  stats: DashboardStatValue[];
  roster: RosterRow[];
  scoutLevelBreakdown: ScoutLevelShare[];
}

/**
 * Fetch lifecycle — matches the `loading | error | ready` convention `MemberDirectory`
 * uses (features/members/components/member-directory.tsx). "Empty" is not a separate
 * state here, same as there: it's a zero-rows condition each panel checks for itself
 * once `ready`, not a whole-page branch.
 */
export type DashboardViewState = 'loading' | 'error' | 'ready';
