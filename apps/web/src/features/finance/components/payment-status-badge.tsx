import { Badge } from '@/shared/components/ui';

import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES } from '../constants';
import type { PaymentStatus } from '../types';

export interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return <Badge tone={PAYMENT_STATUS_TONES[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}
