import type { Metadata } from 'next';

import { ApprovalQueue } from '@/features/approvals/components/approval-queue';
import { PageHeader } from '@/shared/components/layout/page-header';

export const metadata: Metadata = { title: 'Pending Approvals' };

export default function ApprovalsPage() {
  return (
    <>
      <PageHeader
        title="Pending Approvals"
        description="Review new scout and adult leader registrations from the Membership Registry — approve or reject with a reason."
      />
      <ApprovalQueue />
    </>
  );
}
