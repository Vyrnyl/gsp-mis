import type { Metadata } from 'next';

import { PlaceholderPage } from '@/shared/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Analytics' };

export default function AnalyticsPage() {
  return (
    <PlaceholderPage
      title="Analytics"
      description="Executive trends across membership, attendance, badges and finance."
      feature="3.3"
    />
  );
}
