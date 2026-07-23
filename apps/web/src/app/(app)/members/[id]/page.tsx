import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { MemberProfileView } from '@/features/members/components/member-profile-view';
import { roleHasPermission } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Member Profile' };

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([getSession(), params]);
  const canArchive = user ? roleHasPermission(user.role, 'members:archive') : false;

  return <MemberProfileView memberId={id} canArchive={canArchive} />;
}
