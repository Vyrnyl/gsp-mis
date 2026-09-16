import { AnalyticsIcon, AttendanceIcon } from '@/shared/components/icons';
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

import { ATTENDANCE_STAT_PRESENTATION } from '../constants';
import type { AttendanceAnalytics, ViewState } from '../types';
import { AttendanceTrendChart } from './attendance-trend-chart';
import { BreakdownChart } from './breakdown-chart';
import { DimensionBreakdownCard } from './dimension-breakdown-card';

export interface AttendanceTrendsPanelProps {
  viewState: ViewState;
  data: AttendanceAnalytics | null;
  onRetry: () => void;
}

/**
 * 2026-09-16 R4 revision, step 6 — before it, this tab was four totals plus one
 * council-wide attendance rate plotted over time.
 *
 * That single rate is the problem the revision exists to fix: 70% can mean everyone
 * attends most things, or that half the council attends everything while the other
 * half attends nothing. Those are opposite problems calling for opposite responses,
 * and a total cannot tell them apart. The same attendance is now split by school,
 * scout level and troop.
 */
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
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card>
          <TableSkeleton rows={4} columns={6} />
        </Card>
      </div>
    );
  }

  // A troop with no attendance records has no rate to plot — see the chart comment below.
  const charted = data.byTroop.filter((row) => row.attendanceRecords > 0);
  const unrecorded = data.byTroop.filter((row) => row.attendanceRecords === 0);

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => {
          const presentation = ATTENDANCE_STAT_PRESENTATION[stat.id] ?? ATTENDANCE_STAT_PRESENTATION['eventsHeld']!;
          return <StatCard key={stat.id} icon={presentation.icon} tone={presentation.tone} value={stat.value} label={stat.label} />;
        })}
      </div>

      <Card className="mb-3.5">
        <CardHeader title="Attendance Trends" subtitle="Average attendance rate over the selected range" />
        {data.trend.some((point) => point.value > 0) ? (
          <AttendanceTrendChart data={data.trend} />
        ) : (
          /* Was a bare <p>; every other empty surface on this page draws a real
             EmptyState, and the repo rule is that a blank state fails the gate. */
          <EmptyState
            icon={AttendanceIcon}
            title="No attendance recorded in this period"
            description="Once attendance is taken at an event in this range, the trend will appear here."
          />
        )}
      </Card>

      <DimensionBreakdownCard
        title="Attendance by School"
        subtitle="Which schools turn up — and which are not being reached"
        dimensionLabel="School"
        rows={data.bySchool}
        metric="attendanceRate"
        // This is the Attendance tab, so lead with the rate rather than the default
        // members-first order (same reasoning as the Badges tab in step 5).
        leadWithMetric
        emptyTitle="No schools to compare"
        emptyDescription="No member matches the current selection."
      />

      <DimensionBreakdownCard
        title="Attendance by Scout Level"
        subtitle="Turnout across the curriculum progression"
        dimensionLabel="Scout Level"
        rows={data.byLevel}
        metric="attendanceRate"
        // Levels read as a progression, so their order is the curriculum's, not a
        // ranking — seeing which stage stops turning up is the point.
        preserveOrder
        leadWithMetric
        emptyTitle="No scout levels to compare"
        emptyDescription="No member matches the current selection."
      />

      <Card>
        <CardHeader title="Attendance by Troop" subtitle="Present vs. absent per troop, within the current selection" />
        {data.byTroop.length > 0 ? (
          <>
            {/* Only troops with records are plotted. A bar chart has no way to draw
                "no data" — a troop with no records would render as a bar of zero,
                identical to a troop that genuinely never turns up, and the chart would
                contradict the "No data" the table shows on the same row. They stay in
                the table below, where the distinction survives. */}
            {charted.length > 0 ? (
              <BreakdownChart
                labels={charted.map((row) => row.label)}
                values={charted.map((row) => row.attendanceRate)}
                valueLabel="% attendance"
              />
            ) : null}
            {unrecorded.length > 0 ? (
              <p className="mt-2.5 text-[0.8rem] text-muted">
                Not charted: {unrecorded.map((row) => row.label).join(', ')} — no attendance recorded, which is not the same
                as 0% turnout. {unrecorded.length === 1 ? 'It is' : 'They are'} listed below.
              </p>
            ) : null}
            <TableWrapper className="mt-4">
              <Table caption="Attendance by troop">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Troop</TableHeaderCell>
                    <TableHeaderCell>Attendance Rate</TableHeaderCell>
                    <TableHeaderCell>Members</TableHeaderCell>
                    <TableHeaderCell>Present</TableHeaderCell>
                    <TableHeaderCell>Absent</TableHeaderCell>
                    <TableHeaderCell>Records</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.byTroop.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="whitespace-nowrap">{row.label}</span>
                      </TableCell>
                      {/* A troop with no records has no attendance *data* — not 0%
                          turnout. A troop nobody recorded and a troop nobody attends
                          look identical in a rate, and only one is a problem with the
                          troop. */}
                      <TableCell>
                        {row.attendanceRecords > 0 ? `${row.attendanceRate}%` : <span className="text-muted">No data</span>}
                      </TableCell>
                      <TableCell>{row.memberCount}</TableCell>
                      <TableCell>{row.present}</TableCell>
                      <TableCell>{row.absent}</TableCell>
                      <TableCell>{row.attendanceRecords}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </>
        ) : (
          <EmptyState icon={AnalyticsIcon} title="No troops to compare" description="No member matches the current selection." />
        )}
      </Card>
    </div>
  );
}
