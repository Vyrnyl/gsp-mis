import type { Metadata } from 'next';

import { NotificationsView } from '@/features/notifications/components/notifications-view';
import { PageHeader } from '@/shared/components/layout/page-header';

export const metadata: Metadata = { title: 'Notifications' };

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" description="Everything sent to you personally, newest first." />
      <NotificationsView />
    </>
  );
}
