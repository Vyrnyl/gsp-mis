import { Card, CardHeader, ChartSkeleton, ErrorState, StatCard, StatCardSkeleton } from '@/shared/components/ui';

import { ATTENDANCE_STAT_PRESENTATION } from '../constants';
import type { AttendanceAnalytics, ViewState } from '../types';
import { AttendanceTrendChart } from './attendance-trend-chart';

export interface AttendanceTrendsPanelProps {
  viewState: ViewState;
  data: AttendanceAnalytics | null;
  onRetry: () => void;
}

export function AttendanceTrendsPanel({ viewState, data, onRetry }: AttendanceTrendsPanelProps) {
  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load attendance analytics. Check your connection and try again." />
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
          const presentation = ATTENDANCE_STAT_PRESENTATION[stat.id] ?? ATTENDANCE_STAT_PRESENTATION['eventsHeld']!;
          return <StatCard key={stat.id} icon={presentation.icon} tone={presentation.tone} value={stat.value} label={stat.label} />;
        })}
      </div>

      <Card>
        <CardHeader title="Attendance Trends" subtitle="Average attendance rate, last 6 months" />
        {data.trend.some((point) => point.value > 0) ? (
          <AttendanceTrendChart data={data.trend} />
        ) : (
          <p className="py-8 text-center text-[0.85rem] text-muted">No attendance recorded in this period.</p>
        )}
      </Card>
    </div>
  );
}
