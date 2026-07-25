import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { BadgesView } from '@/features/badges/components/badges-view';

export const metadata: Metadata = { title: 'Badges' };

export default async function BadgesPage() {
  const user = await getSession();
  // The (app) layout already redirects to /login when there is no session; this
  // narrows the type for what follows.
  if (!user) return null;

  return <BadgesView user={user} />;
}
