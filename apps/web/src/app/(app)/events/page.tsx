import type { Metadata } from 'next';

import { PlaceholderPage } from '@/shared/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Event Management' };

export default function EventsPage() {
  return (
    <PlaceholderPage
      title="Event Management"
      description="Event calendar, scheduling and troop assignment."
      feature="2.1"
    />
  );
}
