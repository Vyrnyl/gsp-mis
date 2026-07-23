import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { getSession } from '@/features/auth/services/session.service';
import { AppShell } from '@/shared/components/layout/app-shell';

/**
 * Middleware already bounces cookie-less visitors to `/login`; this covers the
 * narrower case of a present-but-invalid cookie (expired/revoked token, deleted
 * user) that middleware's presence-only check lets through.
 */
export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const user = await getSession();
  if (!user) redirect('/login');

  return <AppShell user={user}>{children}</AppShell>;
}
