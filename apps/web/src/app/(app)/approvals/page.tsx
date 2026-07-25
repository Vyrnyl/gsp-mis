import type { Metadata } from 'next';

import { ApprovalQueue } from '@/features/approvals/components/approval-queue';

export const metadata: Metadata = { title: 'Pending Approvals' };

export default function ApprovalsPage() {
  return <ApprovalQueue />;
}
