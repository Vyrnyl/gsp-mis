'use client';

import { useState } from 'react';

import { AnalyticsIcon } from '@/shared/components/icons';
import {
  Card,
  CardHeader,
  ChartSkeleton,
  EmptyState,
  ErrorState,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
  Tabs,
} from '@/shared/components/ui';
import { usePagedItems } from '@/shared/hooks/use-paged-items';

import { BREAKDOWN_DIMENSIONS, type BreakdownDimensionId } from '../constants';
import type { BreakdownAnalytics, ViewState } from '../types';
import { BreakdownChart } from './breakdown-chart';

const PAGE_SIZE = 8;

export interface BreakdownPanelProps {
  viewState: ViewState;
  data: BreakdownAnalytics | null;
  onRetry: () => void;
}

/**
 * Per-dimension slices (2026-09-16 revision) — the evidence behind the Decisions tab.
 * Four sub-tabs share one table/chart pair rather than four near-identical panels,
 * since school, level and badge-area rows all carry the same shape; activity types
 * are keyed by event instead of member, so that one branch renders its own columns.
 */
export function BreakdownPanel({ viewState, data, onRetry }: BreakdownPanelProps) {
  const [dimension, setDimension] = useState<BreakdownDimensionId>('school');

  const isActivity = dimension === 'activityCategory';
  const memberRows =
    dimension === 'school' ? (data?.bySchool ?? []) : dimension === 'level' ? (data?.byLevel ?? []) : (data?.byBadgeCategory ?? []);
  const activityRows = data?.byActivityCategory ?? [];
  const rowCount = isActivity ? activityRows.length : memberRows.length;

  // Paged separately per shape rather than over a union — `usePagedItems` on a
  // `A[] | B[]` collapses the element type to something neither branch can narrow,
  // so each branch keeps its own hook call and the render picks the matching one.
  // Both run unconditionally: hook order must not depend on the active sub-tab.
  const memberPaging = usePagedItems(memberRows, PAGE_SIZE);
  const activityPaging = usePagedItems(activityRows, PAGE_SIZE);
  const { page, setPage, totalItems, pageSize } = isActivity ? activityPaging : memberPaging;

  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load the breakdown. Check your connection and try again." />
      </Card>
    );
  }

  if (viewState === 'loading' || !data) {
    return (
      <div>
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card>
          <TableSkeleton rows={4} columns={4} />
        </Card>
      </div>
    );
  }

  const activeLabel = BREAKDOWN_DIMENSIONS.find((item) => item.id === dimension)?.label ?? '';

  // Badge areas have no meaningful attendance figure (a badge is not an event), so
  // that column is dropped rather than shown as a misleading 0%.
  const showAttendance = dimension !== 'badgeCategory';

  return (
    <div>
      <div className="mb-4">
        <Tabs
          items={BREAKDOWN_DIMENSIONS.map((item) => ({ id: item.id, label: item.label }))}
          activeId={dimension}
          onChange={(id) => {
            setDimension(id as BreakdownDimensionId);
            setPage(1);
          }}
          ariaLabel="Breakdown dimension"
        />
      </div>

      {rowCount === 0 ? (
        <Card>
          <EmptyState
            icon={AnalyticsIcon}
            title="Nothing to break down yet"
            description="Once members, events and badges are recorded, this breakdown will appear here."
          />
        </Card>
      ) : (
        <>
          <Card className="mb-3.5">
            <CardHeader title={activeLabel} />
            <BreakdownChart
              labels={(isActivity ? activityRows : memberRows).map((row) => row.label)}
              values={
                isActivity
                  ? activityRows.map((row) => row.registrations)
                  : dimension === 'badgeCategory'
                    ? memberRows.map((row) => row.badgesEarned)
                    : memberRows.map((row) => row.memberCount)
              }
              valueLabel={isActivity ? 'registrations' : dimension === 'badgeCategory' ? 'badges earned' : 'members'}
            />
          </Card>

          <Card>
            <CardHeader title="Detail" subtitle="Figures for the current filter selection" />
            <TableWrapper>
              <Table caption={`Breakdown ${activeLabel.toLowerCase()}`}>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>{isActivity ? 'Activity Type' : activeLabel.replace('By ', '')}</TableHeaderCell>
                    {isActivity ? (
                      <>
                        <TableHeaderCell>Events</TableHeaderCell>
                        <TableHeaderCell>Registrations</TableHeaderCell>
                        <TableHeaderCell>Attendance Rate</TableHeaderCell>
                      </>
                    ) : (
                      <>
                        <TableHeaderCell>{dimension === 'badgeCategory' ? 'Members Earning' : 'Members'}</TableHeaderCell>
                        {showAttendance ? <TableHeaderCell>Attendance Rate</TableHeaderCell> : null}
                        <TableHeaderCell>Badges Earned</TableHeaderCell>
                        <TableHeaderCell>Badges / Member</TableHeaderCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isActivity
                    ? activityPaging.pageItems.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <span className="whitespace-nowrap">{row.label}</span>
                          </TableCell>
                          <TableCell>{row.eventCount}</TableCell>
                          <TableCell>{row.registrations}</TableCell>
                          <TableCell>{row.attendanceRate}%</TableCell>
                        </TableRow>
                      ))
                    : memberPaging.pageItems.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <span className="whitespace-nowrap">{row.label}</span>
                          </TableCell>
                          <TableCell>{row.memberCount}</TableCell>
                          {showAttendance ? <TableCell>{row.attendanceRate}%</TableCell> : null}
                          <TableCell>{row.badgesEarned}</TableCell>
                          <TableCell>{row.badgesPerMember}</TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableWrapper>
            {rowCount > pageSize ? (
              <Pagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} itemLabel="rows" />
            ) : null}
          </Card>
        </>
      )}
    </div>
  );
}
