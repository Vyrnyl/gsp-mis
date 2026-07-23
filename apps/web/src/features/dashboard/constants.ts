import {
  ApprovalIcon,
  BadgeIcon,
  CouncilIcon,
  MembersIcon,
  SuccessIcon,
  TroopLeaderIcon,
  type IconType,
} from '@/shared/components/icons';
import type { StatCardTone } from '@/shared/components/ui';
import { palette } from '@/shared/design/tokens';

import type { MemberStatusId } from '@/features/members/types';

/**
 * ChartJS needs real hex values, not Tailwind classes — mirrors the tone mapping
 * `MEMBER_STATUS_TONES` (features/members/constants.ts) already uses for badges, so
 * the donut's legend colors agree with the status pills seen elsewhere in the app.
 */
export const STATUS_CHART_COLORS: Record<MemberStatusId, string> = {
  active: palette.green,
  pending: palette.blue,
  expiring: palette.gold2,
  expired: palette.red,
  rejected: palette.red,
  archived: palette.muted,
};

/**
 * Stat cards are presentation-only past their `id`/`label`/`value` (the API contract,
 * `DashboardStatValue`) — icon and tone are looked up here per role rather than sent
 * over the wire, since an `IconType` is a React component and can't be serialized.
 */
export const ADMIN_STAT_PRESENTATION: Record<string, { icon: IconType; tone: StatCardTone }> = {
  councils: { icon: CouncilIcon, tone: 'green' },
  troops: { icon: TroopLeaderIcon, tone: 'gold' },
  members: { icon: MembersIcon, tone: 'blue' },
  pending: { icon: ApprovalIcon, tone: 'red' },
};

export const COUNCIL_STAT_PRESENTATION: Record<string, { icon: IconType; tone: StatCardTone }> = {
  troops: { icon: TroopLeaderIcon, tone: 'green' },
  members: { icon: MembersIcon, tone: 'gold' },
  pending: { icon: ApprovalIcon, tone: 'blue' },
  active: { icon: SuccessIcon, tone: 'red' },
};

export const TROOP_STAT_PRESENTATION: Record<string, { icon: IconType; tone: StatCardTone }> = {
  members: { icon: MembersIcon, tone: 'green' },
  active: { icon: SuccessIcon, tone: 'gold' },
  pending: { icon: ApprovalIcon, tone: 'blue' },
  levels: { icon: BadgeIcon, tone: 'red' },
};
