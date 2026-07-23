import { Badge } from '@/shared/components/ui';

import { MEMBER_STATUS_LABELS, MEMBER_STATUS_TONES } from '../constants';
import type { MemberStatusId } from '../types';

export function MemberStatusBadge({ status }: { status: MemberStatusId }) {
  return <Badge tone={MEMBER_STATUS_TONES[status]}>{MEMBER_STATUS_LABELS[status]}</Badge>;
}
