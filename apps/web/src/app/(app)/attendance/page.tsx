import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { AttendanceView } from '@/features/attendance/components/attendance-view';
import { PageHeader } from '@/shared/components/layout/page-header';
import { roleHasPermission } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Attendance' };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const [user, { eventId }] = await Promise.all([getSession(), searchParams]);
  const canManage = user ? roleHasPermission(user.role, 'attendance:write') : false;

  return (
    <>
      <PageHeader title="Attendance" description="Register participants and record who showed up, per event." />
      <AttendanceView canManage={canManage} initialEventId={eventId} />
    </>
  );
}
