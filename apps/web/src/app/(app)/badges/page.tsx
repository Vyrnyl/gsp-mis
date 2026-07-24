import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { BadgesView } from '@/features/badges/components/badges-view';
import { PageHeader } from '@/shared/components/layout/page-header';

export const metadata: Metadata = { title: 'Badges' };

export default async function BadgesPage() {
  const user = await getSession();
  // The (app) layout already redirects to /login when there is no session; this
  // narrows the type for what follows.
  if (!user) return null;

  return (
    <>
      <PageHeader
        title="Badge & Achievement Management"
        description="Track the badge catalog, member progress, and achievement history."
      />
      <BadgesView user={user} />
    </>
  );
}
