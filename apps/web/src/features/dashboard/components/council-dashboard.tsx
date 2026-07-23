import {
  Card,
  CardHeader,
  CardSkeleton,
  EmptyState,
  ErrorState,
  StatCard,
  StatCardSkeleton,
} from '@/shared/components/ui';

import { ScoutLevelProgress } from './scout-level-progress';
import { TroopOverviewList } from './troop-overview-list';

import { COUNCIL_STAT_PRESENTATION } from '../constants';
import type { CouncilDashboardData, DashboardViewState } from '../types';

export interface CouncilDashboardProps {
  state: DashboardViewState;
  data: CouncilDashboardData;
  onRetry: () => void;
}

/** Executive Council dashboard variant — council-scoped totals, troop roll-up, composition. */
export function CouncilDashboard({ state, data, onRetry }: CouncilDashboardProps) {
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
                {...(COUNCIL_STAT_PRESENTATION[stat.id] ?? COUNCIL_STAT_PRESENTATION['members']!)}
              />
            ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg2:grid-cols-2">
        <Card>
          <CardHeader title="Troops Overview" />
          {state === 'loading' ? (
            <CardSkeleton lines={5} />
          ) : data.troops.length === 0 ? (
            <EmptyState title="No troops yet" description="Troops added to the council will appear here." />
          ) : (
            <TroopOverviewList troops={data.troops} />
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
