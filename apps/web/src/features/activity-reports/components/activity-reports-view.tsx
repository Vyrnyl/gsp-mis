'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AuthUser } from '@/features/auth/types';
import { AddIcon, EyeIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Pagination,
  Table,
  TableAvatar,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
  useToast,
} from '@/shared/components/ui';

import {
  createActivityReport,
  listActivityReports,
  listReportableEvents,
} from '../services/activity-reports.service';
import type { ActivityReportFormValues, ActivityReportSummary, ReportableEvent } from '../types';
import { ActivityReportDetailModal } from './activity-report-detail-modal';
import { ActivityReportFormModal } from './activity-report-form-modal';
import { ActivityReportStatusBadge } from './activity-report-status-badge';

const PAGE_SIZE = 8;

type ViewState = 'loading' | 'error' | 'ready';

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface ActivityReportsViewProps {
  user: AuthUser;
}

/**
 * Loop steps 3–5 (Contract + Wire Read + Wire Write) for Feature 2.3.
 *
 * Two independent role facts, not one: `canSubmit` (write — Admin + Troop Leader,
 * matching the `activity-reports:write` grant) and `showAllTroops` (read scope —
 * everyone except Troop Leader sees every troop's reports, not just their own). Admin
 * gets both: the full cross-troop table *and* a Submit action, matching its
 * "unrestricted access to all modules" (project-overview.md) — resolved this way
 * rather than restricting Admin to read-only, since the existing `activity-reports:write`
 * permission grant already includes Admin and 2.2 set the precedent of trusting an
 * already-correct grant over the terser prose in build-plan.md's Access line.
 */
export function ActivityReportsView({ user }: ActivityReportsViewProps) {
  const { showToast } = useToast();
  const canSubmit = user.role === 'admin' || user.role === 'troop_leader';
  const showAllTroops = user.role !== 'troop_leader';

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [reports, setReports] = useState<ActivityReportSummary[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);

  const [reportableEvents, setReportableEvents] = useState<ReportableEvent[]>([]);
  const [detailReport, setDetailReport] = useState<ActivityReportSummary | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    setViewState('loading');
    try {
      const result = await listActivityReports({ page, pageSize: PAGE_SIZE });
      setReports(result.activityReports);
      setTotalItems(result.totalItems);
      setViewState('ready');
    } catch {
      setViewState('error');
    }
  }, [page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (!canSubmit) return;
    listReportableEvents()
      .then(setReportableEvents)
      .catch(() => showToast('Could not load completed events to report on.', 'error'));
    // Loaded once — the picker only needs to be fresh when the modal is opened, and a
    // missed brand-new completed event is not worth a refetch-on-every-render cost.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSubmit]);

  async function handleSubmitReport(values: ActivityReportFormValues) {
    await createActivityReport(values);
    setIsFormOpen(false);
    showToast('Activity report submitted.', 'success');
    fetchReports();
  }

  return (
    <Card>
      <CardHeader
        title={showAllTroops ? 'Activity Reports' : 'My Activity Reports'}
        subtitle={
          viewState === 'ready'
            ? showAllTroops
              ? `${totalItems.toLocaleString()} across all troops`
              : `${totalItems.toLocaleString()} submitted`
            : undefined
        }
        actions={
          canSubmit ? (
            <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setIsFormOpen(true)}>
              Submit Report
            </Button>
          ) : undefined
        }
      />

      {viewState === 'loading' ? <TableSkeleton rows={4} columns={showAllTroops ? 6 : 4} /> : null}

      {viewState === 'error' ? (
        <ErrorState
          onRetry={fetchReports}
          description="We could not load activity reports. Check your connection and try again."
        />
      ) : null}

      {viewState === 'ready' && reports.length === 0 ? (
        <EmptyState
          title={showAllTroops ? 'No activity reports yet' : "You haven't submitted any reports yet"}
          description={
            showAllTroops
              ? 'Reports submitted by troop leaders after their events will appear here.'
              : 'Submit a report after your next event to keep the Council in the loop.'
          }
        />
      ) : null}

      {viewState === 'ready' && reports.length > 0 ? (
        <>
          <TableWrapper>
            <Table caption={showAllTroops ? 'Activity reports from all troops' : 'My submitted activity reports'}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Event</TableHeaderCell>
                  {showAllTroops ? <TableHeaderCell>Submitted By</TableHeaderCell> : null}
                  {showAllTroops ? <TableHeaderCell>Troop</TableHeaderCell> : null}
                  <TableHeaderCell>Submitted</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <p className="whitespace-nowrap font-semibold text-ink">{report.event.title}</p>
                      <p className="whitespace-nowrap text-[0.78rem] text-muted">
                        {toDisplayDate(report.event.eventDate)}
                      </p>
                    </TableCell>
                    {showAllTroops ? (
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <TableAvatar name={report.submittedBy.fullName} />
                          <span className="whitespace-nowrap">{report.submittedBy.fullName}</span>
                        </div>
                      </TableCell>
                    ) : null}
                    {showAllTroops ? (
                      <TableCell>
                        <span className="whitespace-nowrap">{report.troopName ?? '—'}</span>
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <span className="whitespace-nowrap">{toDisplayDate(report.submittedAt)}</span>
                    </TableCell>
                    <TableCell>
                      <ActivityReportStatusBadge status={report.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          leadingIcon={<EyeIcon aria-hidden />}
                          onClick={() => setDetailReport(report)}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>

          <Pagination
            className="mt-4"
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={totalItems}
            onPageChange={setPage}
            itemLabel="activity reports"
          />
        </>
      ) : null}

      {canSubmit ? (
        <ActivityReportFormModal
          isOpen={isFormOpen}
          eventOptions={reportableEvents}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmitReport}
        />
      ) : null}

      <ActivityReportDetailModal report={detailReport} onClose={() => setDetailReport(null)} />
    </Card>
  );
}
