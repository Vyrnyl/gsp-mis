import { EventIcon } from '@/shared/components/icons';
import { Card, CardHeader, ChartSkeleton, EmptyState, ErrorState, StatCard, StatCardSkeleton } from '@/shared/components/ui';

import { PARTICIPATION_STAT_PRESENTATION } from '../constants';
import type { ParticipationAnalytics, ViewState } from '../types';
import { ParticipationChart } from './participation-chart';

export interface ParticipationPanelProps {
  viewState: ViewState;
  data: ParticipationAnalytics | null;
  onRetry: () => void;
}

export function ParticipationPanel({ viewState, data, onRetry }: ParticipationPanelProps) {
  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load participation analytics. Check your connection and try again." />
      </Card>
    );
  }

  if (viewState === 'loading' || !data) {
    return (
      <div>
        <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <Card>
          <ChartSkeleton />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {data.stats.map((stat) => {
          const presentation = PARTICIPATION_STAT_PRESENTATION[stat.id] ?? PARTICIPATION_STAT_PRESENTATION['totalRegistrations']!;
          return <StatCard key={stat.id} icon={presentation.icon} tone={presentation.tone} value={stat.value} label={stat.label} />;
        })}
      </div>

      <Card>
        <CardHeader title="Event Participation" subtitle="Registrations per event, most recent first" />
        {data.byEvent.length > 0 ? (
          <ParticipationChart data={data.byEvent} />
        ) : (
          <EmptyState icon={EventIcon} title="No event registrations yet" description="Once members register for events, participation will appear here." />
        )}
      </Card>
    </div>
  );
}
