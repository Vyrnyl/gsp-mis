import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { ProfileView } from '@/features/profile/components/profile-view';

export const metadata: Metadata = { title: 'My Profile' };

export default async function ProfilePage() {
  const user = await getSession();
  // The (app) layout already redirects to /login when there is no session; this
  // narrows the type for what follows.
  if (!user) return null;

  return <ProfileView user={user} />;
}
