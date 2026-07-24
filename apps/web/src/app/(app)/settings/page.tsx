import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { SettingsView } from '@/features/settings/components/settings-view';
import { PageHeader } from '@/shared/components/layout/page-header';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await getSession();
  // The (app) layout already redirects to /login when there is no session; this
  // narrows the type for what follows.
  if (!user) return null;

  return (
    <>
      <PageHeader
        title="Settings & System Administration"
        description="Configure the portal, manage users and access, and review the audit trail."
      />
      <SettingsView user={user} />
    </>
  );
}
