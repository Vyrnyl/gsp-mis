import type { Metadata } from 'next';

import { PlaceholderPage } from '@/shared/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Report Generation' };

export default function ReportsPage() {
  return (
    <PlaceholderPage
      title="Report Generation"
      description="Membership, attendance, badge, financial and executive reports with PDF and Excel export."
      feature="3.2"
    />
  );
}
