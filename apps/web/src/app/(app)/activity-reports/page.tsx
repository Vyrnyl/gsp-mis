import type { Metadata } from 'next';

import { ActivityReportsView } from '@/features/activity-reports/components/activity-reports-view';
import { getSession } from '@/features/auth/services/session.service';

export const metadata: Metadata = { title: 'Activity Reports' };

export default async function ActivityReportsPage() {
  const user = await getSession();
  // The (app) layout already redirects to /login when there is no session; this
  // narrows the type for what follows.
  if (!user) return null;

  return <ActivityReportsView user={user} />;
}
