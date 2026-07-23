import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { EventDetailView } from '@/features/events/components/event-detail-view';
import { roleHasPermission } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Event Details' };

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([getSession(), params]);
  const canManage = user ? roleHasPermission(user.role, 'events:write') : false;

  return <EventDetailView eventId={id} canManage={canManage} />;
}
