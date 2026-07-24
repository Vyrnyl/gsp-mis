import { Card, CardHeader, ChartSkeleton, ErrorState, StatCard, StatCardSkeleton } from '@/shared/components/ui';

import { MEMBERSHIP_STAT_PRESENTATION } from '../constants';
import type { MembershipAnalytics, ViewState } from '../types';
import { MembershipTrendChart } from './membership-trend-chart';

export interface MembershipTrendsPanelProps {
  viewState: ViewState;
  data: MembershipAnalytics | null;
  onRetry: () => void;
}

export function MembershipTrendsPanel({ viewState, data, onRetry }: MembershipTrendsPanelProps) {
  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load membership analytics. Check your connection and try again." />
      </Card>
    );
  }

  if (viewState === 'loading' || !data) {
    return (
      <div>
        <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
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
      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => {
          const presentation = MEMBERSHIP_STAT_PRESENTATION[stat.id] ?? MEMBERSHIP_STAT_PRESENTATION['totalMembers']!;
          return <StatCard key={stat.id} icon={presentation.icon} tone={presentation.tone} value={stat.value} label={stat.label} />;
        })}
      </div>

      <Card>
        <CardHeader title="Membership Growth" subtitle="New registrations, last 6 months" />
        {data.trend.some((point) => point.value > 0) ? (
          <MembershipTrendChart data={data.trend} />
        ) : (
          <p className="py-8 text-center text-[0.85rem] text-muted">No new registrations in this period.</p>
        )}
      </Card>
    </div>
  );
}
