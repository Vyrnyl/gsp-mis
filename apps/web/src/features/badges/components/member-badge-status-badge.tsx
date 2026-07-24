import { Badge } from '@/shared/components/ui';

import { MEMBER_BADGE_STATUS_LABELS, MEMBER_BADGE_STATUS_TONES } from '../constants';
import type { MemberBadgeStatus } from '../types';

export interface MemberBadgeStatusBadgeProps {
  status: MemberBadgeStatus;
}

/** Maps `MemberBadgeStatus` to a `Badge` tone/label — same convention as `MemberStatusBadge` (1.3). */
export function MemberBadgeStatusBadge({ status }: MemberBadgeStatusBadgeProps) {
  return <Badge tone={MEMBER_BADGE_STATUS_TONES[status]}>{MEMBER_BADGE_STATUS_LABELS[status]}</Badge>;
}
