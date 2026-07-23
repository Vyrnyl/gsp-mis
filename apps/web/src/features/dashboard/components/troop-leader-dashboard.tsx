import {
  Card,
  CardHeader,
  CardSkeleton,
  EmptyState,
  ErrorState,
  StatCard,
  StatCardSkeleton,
} from '@/shared/components/ui';

import { AddIcon } from '@/shared/components/icons';

import { MyTroopRoster } from './my-troop-roster';
import { ScoutLevelProgress } from './scout-level-progress';

import { TROOP_STAT_PRESENTATION } from '../constants';
import type { DashboardViewState, TroopDashboardData } from '../types';

export interface TroopLeaderDashboardProps {
  state: DashboardViewState;
  data: TroopDashboardData;
  onRetry: () => void;
}

/** Troop Leader dashboard variant — scoped to the leader's own troop roster. */
export function TroopLeaderDashboard({ state, data, onRetry }: TroopLeaderDashboardProps) {
  if (state === 'error') {
    return (
      <ErrorState
        onRetry={onRetry}
        description="We could not load the dashboard. Check your connection and try again."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xs:grid-cols-2 lg2:grid-cols-4">
        {state === 'loading'
          ? Array.from({ length: 4 }).map((_, index) => <StatCardSkeleton key={index} />)
          : data.stats.map((stat) => (
              <StatCard
                key={stat.id}
                label={stat.label}
                value={stat.value.toLocaleString()}
                {...(TROOP_STAT_PRESENTATION[stat.id] ?? TROOP_STAT_PRESENTATION['members']!)}
              />
            ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg2:grid-cols-2">
        <Card>
          <CardHeader title="My Troop" subtitle={`${data.troopCode} · ${data.troopName}`} />
          {state === 'loading' ? (
            <CardSkeleton lines={5} />
          ) : data.roster.length === 0 ? (
            <EmptyState
              icon={AddIcon}
              title="No members registered yet"
              description="Register your first scout or adult leader to see the roster here."
            />
          ) : (
            <MyTroopRoster roster={data.roster} />
          )}
        </Card>
        <Card>
          <CardHeader title="Membership by Scout Level" />
          {state === 'loading' ? (
            <CardSkeleton lines={4} />
          ) : data.scoutLevelBreakdown.length === 0 ? (
            <EmptyState title="No composition yet" description="Scout level breakdown appears once members are registered." />
          ) : (
            <ScoutLevelProgress breakdown={data.scoutLevelBreakdown} />
          )}
        </Card>
      </div>
    </div>
  );
}
