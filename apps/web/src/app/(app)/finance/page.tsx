import type { Metadata } from 'next';

import { PlaceholderPage } from '@/shared/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Financial Tracking' };

export default function FinancePage() {
  return (
    <PlaceholderPage
      title="Financial Tracking"
      description="Payments, expenses, fee types and budget summaries."
      feature="3.1"
    />
  );
}
