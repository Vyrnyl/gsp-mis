import type { Metadata } from 'next';

import { PlaceholderPage } from '@/shared/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Membership Registry' };

export default function MembersPage() {
  return (
    <PlaceholderPage
      title="Membership Registry"
      description="Scout and adult leader records, renewals, archive and restore."
      feature="1.3"
    />
  );
}
