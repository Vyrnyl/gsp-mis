import type { Metadata } from 'next';

import { PlaceholderPage } from '@/shared/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Badges' };

export default function BadgesPage() {
  return (
    <PlaceholderPage
      title="Badges"
      description="Badge catalogue, member progress and achievement verification."
      feature="2.4"
    />
  );
}
