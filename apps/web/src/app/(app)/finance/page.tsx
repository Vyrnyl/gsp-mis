import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { FinanceView } from '@/features/finance/components/finance-view';
import { roleHasPermission } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Financial Tracking' };

export default async function FinancePage() {
  const user = await getSession();
  const canManage = user ? roleHasPermission(user.role, 'finance:write') : false;

  return <FinanceView canManage={canManage} />;
}
