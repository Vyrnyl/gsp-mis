import type { Metadata } from 'next';

import { PlaceholderPage } from '@/shared/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Pending Approvals' };

export default function ApprovalsPage() {
  return (
    <PlaceholderPage
      title="Pending Approvals"
      description="Executive Council review queue for new membership registrations."
      feature="1.4"
    />
  );
}
