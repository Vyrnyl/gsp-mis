'use client';

import { ActivityIcon } from '@/shared/components/icons';
import {
  ActivityDot,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Pagination,
  SearchInput,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
} from '@/shared/components/ui';

import { auditActionTone, formatAuditAction } from '../constants';
import type { AuditLogEntry, ViewState } from '../types';

const ENTITY_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Records' },
  { value: 'member', label: 'Members' },
  { value: 'user', label: 'Users' },
  { value: 'settings', label: 'Settings' },
  { value: 'report', label: 'Reports' },
  { value: 'system', label: 'System (Backups)' },
];

function toDisplayDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export interface AuditLogPanelProps {
  viewState: ViewState;
  entries: AuditLogEntry[];
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  entityTypeFilter: string;
  onEntityTypeFilterChange: (value: string) => void;
  onRetry: () => void;
}

/**
 * Read-only trail over the real `audit_logs` table (build-plan.md §3.4) — the first
 * screen to surface it directly rather than as a backing table for another feature's
 * writes (1.4's approve/reject already write it; this is the first to render it).
 */
export function AuditLogPanel({
  viewState,
  entries,
  totalItems,
  page,
  pageSize,
  onPageChange,
  search,
  onSearchChange,
  entityTypeFilter,
  onEntityTypeFilterChange,
  onRetry,
}: AuditLogPanelProps) {
  const hasActiveFilters = search.length > 0 || entityTypeFilter !== 'all';

  return (
    <Card>
      <CardHeader
        title="Audit Log"
        subtitle={viewState === 'ready' ? `${totalItems.toLocaleString()} record${totalItems === 1 ? '' : 's'}` : undefined}
      />

      <div className="mb-4 flex flex-wrap gap-2.5">
        <SearchInput
          label="Search audit log"
          placeholder="Search by user or action…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onClear={() => onSearchChange('')}
          className="w-full sm:w-64"
        />
        <Select
          aria-label="Filter by record type"
          className="w-full sm:w-48"
          options={ENTITY_TYPE_FILTER_OPTIONS}
          value={entityTypeFilter}
          onChange={(event) => onEntityTypeFilterChange(event.target.value)}
        />
      </div>

      {viewState === 'loading' ? <TableSkeleton rows={6} columns={4} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={onRetry} description="We could not load the audit log. Check your connection and try again." />
      ) : null}

      {viewState === 'ready' && entries.length === 0 && !hasActiveFilters ? (
        <EmptyState
          icon={ActivityIcon}
          title="No activity recorded yet"
          description="Critical actions across the portal will appear here as they happen."
        />
      ) : null}

      {viewState === 'ready' && entries.length === 0 && hasActiveFilters ? (
        <EmptyState
          icon={ActivityIcon}
          title="No records match your filters"
          description="Try a different search term or clear the record-type filter."
        />
      ) : null}

      {viewState === 'ready' && entries.length > 0 ? (
        <>
          <TableWrapper>
            <Table caption="Audit log">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Time</TableHeaderCell>
                  <TableHeaderCell>User</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                  <TableHeaderCell>Record</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">{toDisplayDateTime(entry.createdAt)}</TableCell>
                    <TableCell>{entry.actorName ?? <span className="text-muted">System</span>}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ActivityDot tone={auditActionTone(entry.action)} />
                        {formatAuditAction(entry.action)}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-muted">{entry.entityType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>

          <Pagination
            className="mt-4"
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={onPageChange}
            itemLabel="records"
          />
        </>
      ) : null}
    </Card>
  );
}
