import { ActivityDot, ActivityItem, Badge } from '@/shared/components/ui';

import type { TroopOverviewRow } from '../types';

export interface TroopOverviewListProps {
  troops: TroopOverviewRow[];
}

/** Troop roll-up list — registry §3. Shared by the Admin and Executive Council dashboards. */
export function TroopOverviewList({ troops }: TroopOverviewListProps) {
  return (
    <div>
      {troops.map((troop, index) => (
        <ActivityItem
          key={troop.id}
          leading={<ActivityDot tone={troop.hasLeader ? 'green' : 'gold'} />}
          title={
            <span className="font-semibold text-ink">
              {troop.troopCode} — {troop.name}
            </span>
          }
          meta={`${troop.memberCount} member${troop.memberCount === 1 ? '' : 's'}${troop.leaderName ? ` · ${troop.leaderName}` : ''}`}
          trailing={<Badge tone={troop.hasLeader ? 'green' : 'gray'}>{troop.hasLeader ? 'Led' : 'No Leader'}</Badge>}
          className={index === troops.length - 1 ? 'border-b-0' : undefined}
        />
      ))}
    </div>
  );
}
