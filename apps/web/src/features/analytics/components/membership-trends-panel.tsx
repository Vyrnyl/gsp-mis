import { MEMBER_STATUS_LABELS, MEMBER_STATUS_TONES } from '@/features/members/constants';
import { MembersIcon } from '@/shared/components/icons';
import {
  Badge,
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

import { MEMBERSHIP_STAT_PRESENTATION } from '../constants';
import type { MembershipAnalytics, ViewState } from '../types';
import { DimensionBreakdownCard } from './dimension-breakdown-card';
import { MembershipTrendChart } from './membership-trend-chart';

export interface MembershipTrendsPanelProps {
  viewState: ViewState;
  data: MembershipAnalytics | null;
  onRetry: () => void;
}

/**
 * 2026-09-16 R4 revision — the tab the user named when describing the problem: it
 * showed Total / Active / Pending / New and a registrations-per-month line, which is
 * four totals and a fifth total over time, split by nothing.
 *
 * It now breaks the same roster down by school, by scout level and by status, each
 * charted and tabulated. The trend stays as context rather than being the only
 * non-total thing on the page.
 */
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
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card>
          <TableSkeleton rows={4} columns={5} />
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

      <Card className="mb-3.5">
        <CardHeader title="Membership Growth" subtitle="New registrations over the selected range" />
        {data.trend.some((point) => point.value > 0) ? (
          <MembershipTrendChart data={data.trend} />
        ) : (
          <p className="py-8 text-center text-[0.85rem] text-muted">No new registrations in this period.</p>
        )}
      </Card>

      <DimensionBreakdownCard
        title="Members by School"
        subtitle="Where the council's members come from"
        dimensionLabel="School"
        rows={data.bySchool}
        metric="members"
        emptyTitle="No members to break down"
        emptyDescription="No member matches the current selection."
      />

      <DimensionBreakdownCard
        title="Members by Scout Level"
        subtitle="Level population from youngest to oldest — where the council thins out"
        dimensionLabel="Level"
        rows={data.byLevel}
        metric="members"
        // Levels are a progression (Twinkler → Cadet). Re-ranking them by size would
        // hide the one thing this chart is for: seeing where the pipeline drops off.
        preserveOrder
        emptyTitle="No members to break down"
        emptyDescription="No member matches the current selection."
      />

      <Card>
        <CardHeader
          title="Members by Status"
          subtitle="Every status on the roster — the stat cards above name only two of them"
        />
        {data.byStatus.length > 0 ? (
          <TableWrapper>
            <Table caption="Members by registration status">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Members</TableHeaderCell>
                  <TableHeaderCell>Share</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.byStatus.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge tone={MEMBER_STATUS_TONES[row.label as keyof typeof MEMBER_STATUS_TONES] ?? 'gray'}>
                        {MEMBER_STATUS_LABELS[row.label as keyof typeof MEMBER_STATUS_LABELS] ?? row.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.memberCount}</TableCell>
                    <TableCell>{row.share}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        ) : (
          <EmptyState
            icon={MembersIcon}
            title="No members to break down"
            description="No member matches the current selection."
          />
        )}
      </Card>
    </div>
  );
}
