import type { Metadata } from 'next';

import { AnnouncementsView } from '@/features/announcements/components/announcements-view';
import { getSession } from '@/features/auth/services/session.service';
import { PageHeader } from '@/shared/components/layout/page-header';

export const metadata: Metadata = { title: 'Announcements' };

export default async function AnnouncementsPage() {
  const user = await getSession();
  // The (app) layout already redirects to /login when there is no session; this
  // narrows the type for what follows.
  if (!user) return null;

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Council notices and updates for every troop."
      />
      <AnnouncementsView user={user} />
    </>
  );
}
