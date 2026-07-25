import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { OrganizationManagement } from '@/features/organizations/components/organization-management';
import { roleHasPermission } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Councils & Troops' };

export default async function OrganizationsPage() {
  const user = await getSession();
  const canManage = user ? roleHasPermission(user.role, 'organizations:write') : false;

  return <OrganizationManagement canManage={canManage} />;
}
