import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { AttendanceView } from '@/features/attendance/components/attendance-view';
import { roleHasPermission } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Attendance' };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const [user, { eventId }] = await Promise.all([getSession(), searchParams]);
  const canManage = user ? roleHasPermission(user.role, 'attendance:write') : false;

  return <AttendanceView canManage={canManage} initialEventId={eventId} />;
}
