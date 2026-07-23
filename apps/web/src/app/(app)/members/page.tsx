import type { Metadata } from 'next';

import { getSession } from '@/features/auth/services/session.service';
import { MemberDirectory } from '@/features/members/components/member-directory';
import { PageHeader } from '@/shared/components/layout/page-header';
import { roleHasPermission } from '@/shared/constants/roles';

export const metadata: Metadata = { title: 'Membership Registry' };

export default async function MembersPage() {
  const user = await getSession();
  const canArchive = user ? roleHasPermission(user.role, 'members:archive') : false;

  return (
    <>
      <PageHeader
        title="Membership Registry"
        description="Scout and adult leader records, renewals, archive and restore."
      />
      <MemberDirectory canArchive={canArchive} />
    </>
  );
}
