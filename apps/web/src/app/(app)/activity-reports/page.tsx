import type { Metadata } from 'next';

import { ActivityReportsView } from '@/features/activity-reports/components/activity-reports-view';
import { getSession } from '@/features/auth/services/session.service';
import { PageHeader } from '@/shared/components/layout/page-header';

export const metadata: Metadata = { title: 'Activity Reports' };

export default async function ActivityReportsPage() {
  const user = await getSession();
  // The (app) layout already redirects to /login when there is no session; this
  // narrows the type for what follows.
  if (!user) return null;

  return (
    <>
      <PageHeader
        title="Activity Reports"
        description={
          user.role === 'troop_leader'
            ? 'Submit a report after each event and track what the Council has reviewed.'
            : 'Reports submitted by troop leaders after their events, across every troop.'
        }
      />
      <ActivityReportsView user={user} />
    </>
  );
}
