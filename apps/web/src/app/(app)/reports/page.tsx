import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { ReportsView } from '@/features/reports/components/reports-view';
import { PageHeader } from '@/shared/components/layout/page-header';
import { roleHasPermission } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Report Generation' };

export default async function ReportsPage() {
  const user = await getSession();
  // The (app) layout already redirects to /login when there is no session; this
  // narrows the type for what follows.
  if (!user) return null;

  return (
    <>
      <PageHeader
        title="Report Generation"
        description="Membership, attendance, badge, financial and executive reports with PDF and Excel export."
      />
      <ReportsView role={user.role} canExport={roleHasPermission(user.role, 'reports:export')} />
    </>
  );
}
