import type { Metadata } from 'next';

import { PlaceholderPage } from '@/shared/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      description="Membership totals, growth and activity at a glance."
      feature="1.5"
    />
  );
}
