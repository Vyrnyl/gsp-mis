import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { EventsView } from '@/features/events/components/events-view';
import { roleHasPermission } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Events' };

export default async function EventsPage() {
  const user = await getSession();
  const canManage = user ? roleHasPermission(user.role, 'events:write') : false;

  return <EventsView canManage={canManage} />;
}
