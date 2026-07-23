import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { OrganizationManagement } from '@/features/organizations/components/organization-management';
import { PageHeader } from '@/shared/components/layout/page-header';
import { roleHasPermission } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Councils & Troops' };

export default async function OrganizationsPage() {
  const user = await getSession();
  const canManage = user ? roleHasPermission(user.role, 'organizations:write') : false;

  return (
    <>
      <PageHeader
        title="Councils & Troops"
        description="Councils, troops, scout levels, badge categories and activity categories."
      />
      <OrganizationManagement canManage={canManage} />
    </>
  );
}
