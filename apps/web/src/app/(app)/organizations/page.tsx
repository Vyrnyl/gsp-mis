import type { Metadata } from 'next';

import { PlaceholderPage } from '@/shared/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Councils & Troops' };

export default function OrganizationsPage() {
  return (
    <PlaceholderPage
      title="Councils & Troops"
      description="Organisation hierarchy, scout levels and category configuration."
      feature="1.6"
    />
  );
}
