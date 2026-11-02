import { MembersIcon } from '@/shared/components/icons';
import {
  Card,
  CardHeader,
  CardSkeleton,
  ChartSkeleton,
  EmptyState,
  ErrorState,
  ProgressBar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrapper,
} from '@/shared/components/ui';

import type { PopulationAnalytics, PopulationBreakdownRow, ViewState } from '../types';
import { BreakdownChart } from './breakdown-chart';

export interface PopulationPanelProps {
  viewState: ViewState;
  data: PopulationAnalytics | null;
  onRetry: () => void;
}

interface PopulationBreakdownProps {
  title: string;
  subtitle: string;
  dimensionLabel: string;
  rows: PopulationBreakdownRow[];
}

/** Chart plus exact figures, like `DimensionBreakdownCard`. That card's table is built
 * around attendance and badge columns, which a headcount of scouts does not have. */
function PopulationBreakdown({ title, subtitle, dimensionLabel, rows }: PopulationBreakdownProps) {
  return (
    <Card className="mb-3.5 last:mb-0">
      <CardHeader title={title} subtitle={subtitle} />
      {rows.length > 0 ? (
        <>
          <BreakdownChart labels={rows.map((row) => row.label)} values={rows.map((row) => row.memberCount)} valueLabel="scouts" />
          <TableWrapper className="mt-4">
            <Table caption={title}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{dimensionLabel}</TableHeaderCell>
                  <TableHeaderCell>Scouts</TableHeaderCell>
                  <TableHeaderCell>Share</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="whitespace-nowrap">{row.label}</span>
                    </TableCell>
                    <TableCell>{row.memberCount}</TableCell>
                    <TableCell>{row.share}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        </>
      ) : (
        <EmptyState icon={MembersIcon} title="No scouts to break down" description="No scout matches the current selection." />
      )}
    </Card>
  );
}

/**
 * The landing tab (client batch items 8 + 9, 2026-11-02): the total population of girls
 * against an automatic milestone, split by municipality, school and scout level.
 *
 * The total leaves out pending scouts, so the pending count sits directly under it.
 * Without that line this tab and the Membership tab show different totals with nothing
 * to explain why.
 */
export function PopulationPanel({ viewState, data, onRetry }: PopulationPanelProps) {
  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load population analytics. Check your connection and try again." />
      </Card>
    );
  }

  if (viewState === 'loading' || !data) {
    return (
      <div>
        <Card className="mb-3.5">
          <CardSkeleton />
        </Card>
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card>
          <ChartSkeleton />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-3.5">
        <CardHeader title="Total Population of Girls" subtitle="Active and expiring scouts. Adult leaders are not counted." />
        <p className="text-[1.8rem] font-bold leading-tight text-brand-green">
          {data.total}
          <span className="text-[1.1rem] font-semibold text-muted"> / {data.nextMilestone}</span>
        </p>
        <ProgressBar
          className="mt-3"
          value={data.percent}
          label={`${data.total} of ${data.nextMilestone} scouts, ${data.percent}% of the next milestone`}
        />
        <p className="mt-2 text-[0.8rem] text-muted">
          Next milestone: {data.nextMilestone} scouts ({data.percent}% reached)
        </p>
        {data.pendingApproval > 0 ? (
          <p className="mt-1 text-[0.8rem] text-muted">
            {data.pendingApproval} {data.pendingApproval === 1 ? 'scout' : 'scouts'} pending approval, not counted yet.
          </p>
        ) : null}
      </Card>

      <PopulationBreakdown
        title="Scouts by Municipality"
        subtitle="Where the council's girls are, largest first"
        dimensionLabel="Municipality"
        rows={data.byMunicipality}
      />
      <PopulationBreakdown
        title="Scouts by School"
        subtitle="Schools with the most girls, largest first"
        dimensionLabel="School"
        rows={data.bySchool}
      />
      <PopulationBreakdown
        title="Scouts by Level"
        subtitle="From youngest to oldest"
        dimensionLabel="Level"
        rows={data.byLevel}
      />
    </div>
  );
}
