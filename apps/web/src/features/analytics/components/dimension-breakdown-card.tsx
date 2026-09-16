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
  /**
   * Lead the table with the metric the chart ranks by, instead of the default
   * members-first column order (2026-09-16 R4 step 5).
   *
   * Opt-in because it only matters where the tab's subject is not membership: on the
   * Badges tab the default order buries "Badges Earned" behind an Attendance Rate
   * column that has nothing to do with badges — and on a narrow screen the one column
   * the reader came for is the one scrolled off the edge. Membership keeps the default.
   */
  leadWithMetric?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}

/** Column order per metric when `leadWithMetric` is set. */
const LEAD_COLUMN: Record<BreakdownMetric, string> = {
  members: 'Members',
  attendanceRate: 'Attendance Rate',
  badgesEarned: 'Badges Earned',
};

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
  leadWithMetric = false,
  emptyTitle,
  emptyDescription,
}: DimensionBreakdownCardProps) {
  const config = METRIC_CONFIG[metric];
  const ordered = preserveOrder ? rows : [...rows].sort((a, b) => config.value(b) - config.value(a));

  /** Zero attendance *records* is missing data, not 0% turnout — showing "0%" there
   * would read as a group that never shows up, a different and much worse claim. */
  const attendanceCell = (row: DimensionBreakdownRow) =>
    row.attendanceRecords > 0 ? `${row.attendanceRate}%` : <span className="text-muted">No data</span>;

  const columns: { header: string; cell: (row: DimensionBreakdownRow) => React.ReactNode }[] = [
    { header: 'Members', cell: (row) => row.memberCount },
    { header: 'Attendance Rate', cell: attendanceCell },
    { header: 'Badges Earned', cell: (row) => row.badgesEarned },
    { header: 'Badges / Member', cell: (row) => row.badgesPerMember },
  ];

  // Move the ranked metric's column to the front, leaving the rest in their existing
  // relative order, so only the lead changes rather than the whole layout.
  const orderedColumns = leadWithMetric
    ? [
        ...columns.filter((column) => column.header === LEAD_COLUMN[metric]),
        ...columns.filter((column) => column.header !== LEAD_COLUMN[metric]),
      ]
    : columns;

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
                  {orderedColumns.map((column) => (
                    <TableHeaderCell key={column.header}>{column.header}</TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ordered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="whitespace-nowrap">{row.label}</span>
                    </TableCell>
                    {orderedColumns.map((column) => (
                      <TableCell key={column.header}>{column.cell(row)}</TableCell>
                    ))}
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
