import { BadgeIcon } from '@/shared/components/icons';
import { Card, CardHeader, ChartSkeleton, EmptyState, ErrorState, StatCard, StatCardSkeleton } from '@/shared/components/ui';

import { BADGE_STAT_PRESENTATION } from '../constants';
import type { BadgeAnalytics, ViewState } from '../types';
import { BadgeCompletionChart } from './badge-completion-chart';

export interface BadgeCompletionPanelProps {
  viewState: ViewState;
  data: BadgeAnalytics | null;
  onRetry: () => void;
}

export function BadgeCompletionPanel({ viewState, data, onRetry }: BadgeCompletionPanelProps) {
  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load badge analytics. Check your connection and try again." />
      </Card>
    );
  }

  if (viewState === 'loading' || !data) {
    return (
      <div>
        <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-3">
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
      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {data.stats.map((stat) => {
          const presentation = BADGE_STAT_PRESENTATION[stat.id] ?? BADGE_STAT_PRESENTATION['totalAwarded']!;
          return <StatCard key={stat.id} icon={presentation.icon} tone={presentation.tone} value={stat.value} label={stat.label} />;
        })}
      </div>

      <Card>
        <CardHeader title="Badge Completion" subtitle="% of members who have earned or verified each badge" />
        {data.completionByBadge.length > 0 ? (
          <BadgeCompletionChart data={data.completionByBadge} />
        ) : (
          <EmptyState icon={BadgeIcon} title="No badges in the catalog yet" description="Once badges are added and recorded, completion rates will appear here." />
        )}
      </Card>
    </div>
  );
}
