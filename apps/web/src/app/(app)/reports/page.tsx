import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { ReportsView } from '@/features/reports/components/reports-view';
import { roleHasPermission } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Report Generation' };

export default async function ReportsPage() {
  const user = await getSession();
  // The (app) layout already redirects to /login when there is no session; this
  // narrows the type for what follows.
  if (!user) return null;

  return <ReportsView role={user.role} canExport={roleHasPermission(user.role, 'reports:export')} />;
}
