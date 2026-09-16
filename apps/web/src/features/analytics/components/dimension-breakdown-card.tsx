import { AnalyticsIcon } from '@/shared/components/icons';
import {
  Card,
  CardHeader,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrapper,
} from '@/shared/components/ui';

import type { DimensionBreakdownRow } from '../types';
import { BreakdownChart } from './breakdown-chart';

/** Which metric the chart ranks by, and what the table therefore leads with. */
export type BreakdownMetric = 'members' | 'attendanceRate' | 'badgesEarned';

export interface DimensionBreakdownCardProps {
  title: string;
  subtitle: string;
  /** Column header for the dimension itself, e.g. "School" or "Level". */
  dimensionLabel: string;
  rows: DimensionBreakdownRow[];
  metric: BreakdownMetric;
  /** Levels read as a progression, so their given order is kept; most other
   * dimensions are more useful ranked largest-first. */
  preserveOrder?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}

const METRIC_CONFIG: Record<BreakdownMetric, { value: (row: DimensionBreakdownRow) => number; unit: string }> = {
  members: { value: (row) => row.memberCount, unit: 'members' },
  attendanceRate: { value: (row) => row.attendanceRate, unit: '%' },
  badgesEarned: { value: (row) => row.badgesEarned, unit: 'badges' },
};

/**
 * One dimensional breakdown — chart above, exact figures below (2026-09-16 R4
 * revision). Built once and reused by Membership, Attendance, Participation and
 * Badges, since "members by school" and "attendance rate by level" differ only in
 * which column they rank by.
 *
 * Both renderings are required by the revision's gate: the chart answers "who is
 * biggest?" at a glance, while the table carries exact numbers and gives screen
 * readers real rows instead of a canvas.
 */
export function DimensionBreakdownCard({
  title,
  subtitle,
  dimensionLabel,
  rows,
  metric,
  preserveOrder = false,
  emptyTitle,
  emptyDescription,
}: DimensionBreakdownCardProps) {
  const config = METRIC_CONFIG[metric];
  const ordered = preserveOrder ? rows : [...rows].sort((a, b) => config.value(b) - config.value(a));

  return (
    <Card className="mb-3.5">
      <CardHeader title={title} subtitle={subtitle} />
      {ordered.length > 0 ? (
        <>
          <BreakdownChart
            labels={ordered.map((row) => row.label)}
            values={ordered.map(config.value)}
            valueLabel={config.unit}
          />
          <TableWrapper className="mt-4">
            <Table caption={title}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{dimensionLabel}</TableHeaderCell>
                  <TableHeaderCell>Members</TableHeaderCell>
                  <TableHeaderCell>Attendance Rate</TableHeaderCell>
                  <TableHeaderCell>Badges Earned</TableHeaderCell>
                  <TableHeaderCell>Badges / Member</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="whitespace-nowrap">{row.label}</span>
                    </TableCell>
                    <TableCell>{row.memberCount}</TableCell>
                    {/* Zero attendance *records* is missing data, not 0% turnout —
                        showing "0%" there would read as a group that never shows up,
                        which is a different and much worse claim. */}
                    <TableCell>
                      {row.attendanceRecords > 0 ? `${row.attendanceRate}%` : <span className="text-muted">No data</span>}
                    </TableCell>
                    <TableCell>{row.badgesEarned}</TableCell>
                    <TableCell>{row.badgesPerMember}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        </>
      ) : (
        <EmptyState icon={AnalyticsIcon} title={emptyTitle} description={emptyDescription} />
      )}
    </Card>
  );
}
