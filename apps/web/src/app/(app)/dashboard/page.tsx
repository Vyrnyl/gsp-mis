import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { DashboardView } from '@/features/dashboard/components/dashboard-view';
import { PageHeader } from '@/shared/components/layout/page-header';
import { ROLE_LABELS } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await getSession();
  // The (app) layout already redirects to /login when there is no session; this
  // narrows the type for what follows.
  if (!user) return null;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.fullName.split(' ')[0]} — here's the ${ROLE_LABELS[user.role]} overview.`}
      />
      <DashboardView user={user} />
    </>
  );
}
