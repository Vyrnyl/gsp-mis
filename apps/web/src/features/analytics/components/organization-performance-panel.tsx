import { CouncilIcon } from '@/shared/components/icons';
import {
  Card,
  CardHeader,
  ChartSkeleton,
  EmptyState,
  ErrorState,
  StatCard,
  StatCardSkeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
} from '@/shared/components/ui';

import { ORGANIZATION_STAT_PRESENTATION } from '../constants';
import type { OrganizationAnalytics, ViewState } from '../types';
import { OrganizationPerformanceChart } from './organization-performance-chart';

export interface OrganizationPerformancePanelProps {
  viewState: ViewState;
  data: OrganizationAnalytics | null;
  onRetry: () => void;
}

export function OrganizationPerformancePanel({ viewState, data, onRetry }: OrganizationPerformancePanelProps) {
  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load organization analytics. Check your connection and try again." />
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
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card>
          <TableSkeleton rows={3} columns={4} />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {data.stats.map((stat) => {
          const presentation = ORGANIZATION_STAT_PRESENTATION[stat.id] ?? ORGANIZATION_STAT_PRESENTATION['totalTroops']!;
          return <StatCard key={stat.id} icon={presentation.icon} tone={presentation.tone} value={stat.value} label={stat.label} />;
        })}
      </div>

      {data.troops.length > 0 ? (
        <>
          <Card className="mb-3.5">
            <CardHeader title="Members by Troop" />
            <OrganizationPerformanceChart data={data.troops} />
          </Card>

          <Card>
            <CardHeader title="Troop Performance" subtitle="Membership, attendance and badge activity by troop" />
            <TableWrapper>
              <Table caption="Organization performance by troop">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Troop</TableHeaderCell>
                    <TableHeaderCell>Members</TableHeaderCell>
                    <TableHeaderCell>Attendance Rate</TableHeaderCell>
                    <TableHeaderCell>Badges Earned</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.troops.map((troop) => (
                    <TableRow key={troop.troopId}>
                      <TableCell>
                        <span className="whitespace-nowrap">{troop.troopName}</span>
                      </TableCell>
                      <TableCell>{troop.memberCount}</TableCell>
                      <TableCell>{troop.attendanceRate}%</TableCell>
                      <TableCell>{troop.badgesEarned}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState icon={CouncilIcon} title="No troops recorded yet" description="Once troops are added, organization performance will appear here." />
        </Card>
      )}
    </div>
  );
}
