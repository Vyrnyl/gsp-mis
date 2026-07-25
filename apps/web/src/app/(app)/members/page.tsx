import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { MemberDirectory } from '@/features/members/components/member-directory';
import { roleHasPermission } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Membership Registry' };

export default async function MembersPage() {
  const user = await getSession();
  const canArchive = user ? roleHasPermission(user.role, 'members:archive') : false;
  const isTroopLeader = user?.role === 'troop_leader';

  return (
    <MemberDirectory
      canArchive={canArchive}
      currentUserId={user && isTroopLeader ? user.id : null}
      isTroopLeader={isTroopLeader}
    />
  );
}
