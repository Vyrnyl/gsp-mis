import type { Metadata } from 'next';

import { PlaceholderPage } from '@/shared/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Attendance' };

export default function AttendancePage() {
  return (
    <PlaceholderPage
      title="Attendance"
      description="Event registration, attendance checklists and summaries."
      feature="2.2"
    />
  );
}
