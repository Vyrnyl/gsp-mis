import { ActivityItem, TableAvatar } from '@/shared/components/ui';

import { MemberStatusBadge } from '@/features/members/components/member-status-badge';

import type { RosterRow } from '../types';

export interface MyTroopRosterProps {
  roster: RosterRow[];
}

/** Troop leader's own roster — registry §3. Reuses `MemberStatusBadge` from Feature 1.3. */
export function MyTroopRoster({ roster }: MyTroopRosterProps) {
  return (
    <div>
      {roster.map((member, index) => (
        <ActivityItem
          key={member.id}
          leading={<TableAvatar name={member.name} />}
          title={<span className="font-semibold text-ink">{member.name}</span>}
          meta={member.scoutLevelName ?? 'Adult Leader'}
          trailing={<MemberStatusBadge status={member.status} />}
          className={index === roster.length - 1 ? 'border-b-0' : undefined}
        />
      ))}
    </div>
  );
}
