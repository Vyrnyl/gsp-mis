import {
  Card,
  CardHeader,
  CardSkeleton,
  ChartSkeleton,
  EmptyState,
  ErrorState,
  StatCard,
  StatCardSkeleton,
} from '@/shared/components/ui';

import { MembershipGrowthChart } from './membership-growth-chart';
import { MemberStatusDonut } from './member-status-donut';
import { RecentActivityList } from './recent-activity-list';
import { TroopOverviewList } from './troop-overview-list';

import { ADMIN_STAT_PRESENTATION } from '../constants';
import type { AdminDashboardData, DashboardViewState } from '../types';

export interface AdminDashboardProps {
  state: DashboardViewState;
  data: AdminDashboardData;
  onRetry: () => void;
}

/** Administrator dashboard variant — org-wide totals, growth trend, status mix. */
export function AdminDashboard({ state, data, onRetry }: AdminDashboardProps) {
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
                {...(ADMIN_STAT_PRESENTATION[stat.id] ?? ADMIN_STAT_PRESENTATION['members']!)}
              />
            ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg2:grid-cols-2">
        <Card>
          <CardHeader title="Membership Growth" subtitle="New registrations, last 6 months" />
          {state === 'loading' ? (
            <ChartSkeleton />
          ) : data.growth.length === 0 ? (
            <EmptyState
              title="No registrations yet"
              description="New member registrations will appear here as troops start enrolling scouts."
            />
          ) : (
            <MembershipGrowthChart data={data.growth} />
          )}
        </Card>
        <Card>
          <CardHeader title="Members by Status" />
          {state === 'loading' ? (
            <ChartSkeleton />
          ) : data.statusBreakdown.length === 0 ? (
            <EmptyState title="Nothing to show yet" description="A status breakdown appears once members are registered." />
          ) : (
            <MemberStatusDonut data={data.statusBreakdown} />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg2:grid-cols-2">
        <Card>
          <CardHeader title="Recent Activity" />
          {state === 'loading' ? (
            <CardSkeleton lines={5} />
          ) : data.recentActivity.length === 0 ? (
            <EmptyState title="No recent activity" description="Registrations, approvals and renewals will show up here." />
          ) : (
            <RecentActivityList activity={data.recentActivity} />
          )}
        </Card>
        <Card>
          <CardHeader title="Troops Overview" />
          {state === 'loading' ? (
            <CardSkeleton lines={5} />
          ) : data.troops.length === 0 ? (
            <EmptyState title="No troops yet" description="Add a troop to the org hierarchy to see it here." />
          ) : (
            <TroopOverviewList troops={data.troops} />
          )}
        </Card>
      </div>
    </div>
  );
}
