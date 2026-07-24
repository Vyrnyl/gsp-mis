import type { Metadata } from 'next';

import { AnalyticsView } from '@/features/analytics/components/analytics-view';
import { PageHeader } from '@/shared/components/layout/page-header';

export const metadata: Metadata = { title: 'Analytics' };

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" description="Executive trends across membership, attendance, participation, badges and finance." />
      <AnalyticsView />
    </>
  );
}
