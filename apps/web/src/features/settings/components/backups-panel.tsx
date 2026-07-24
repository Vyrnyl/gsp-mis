'use client';

import { BackupIcon } from '@/shared/components/icons';
import { ActivityDot, ActivityItem, Alert, Button, Card, CardHeader, CardSkeleton, EmptyState, ErrorState } from '@/shared/components/ui';

import { auditActionTone } from '../constants';
import type { AuditLogEntry, BackupInfo, ViewState } from '../types';

function toDisplayDateTime(iso: string | null): string {
  if (!iso) return 'Never run';
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export interface BackupsPanelProps {
  viewState: ViewState;
  backupInfo: BackupInfo | null;
  recentBackups: AuditLogEntry[];
  isRunning: boolean;
  onRunBackup: () => Promise<void>;
  onRetry: () => void;
}

/**
 * Manage backups (project-overview.md's Admin "System Administration" section).
 * There is no real database-dump job in this codebase — "Run Backup Now" writes a
 * real `audit_logs` row and a real `system_settings.backup.last_run_at` timestamp,
 * the same honest simplification as 1.1's non-delivering forgot-password: the
 * action and its trail are real, the underlying infrastructure is out of scope.
 */
export function BackupsPanel({ viewState, backupInfo, recentBackups, isRunning, onRunBackup, onRetry }: BackupsPanelProps) {
  if (viewState === 'error') {
    return <ErrorState onRetry={onRetry} description="We could not load backup status. Check your connection and try again." />;
  }

  if (viewState === 'loading') {
    return (
      <Card>
        <CardSkeleton lines={2} />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Manual Backup" subtitle="Trigger an on-demand backup and record it in the audit log" />
        <Alert tone="info" live={false} className="mb-4">
          This demo environment does not run a real database dump — triggering a backup records a real, auditable
          event so the workflow can be tested end to end.
        </Alert>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-hairline-subtle bg-subtle px-4 py-3.5">
          <div>
            <p className="text-[0.92rem] font-semibold text-ink">Last Backup</p>
            <p className="text-[0.85rem] text-muted">
              {toDisplayDateTime(backupInfo?.lastRunAt ?? null)}
              {backupInfo?.lastRunByName ? ` — by ${backupInfo.lastRunByName}` : ''}
            </p>
          </div>
          <Button leadingIcon={<BackupIcon />} isLoading={isRunning} onClick={onRunBackup}>
            Run Backup Now
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Backup History" />
        {recentBackups.length === 0 ? (
          <EmptyState icon={BackupIcon} title="No backups recorded yet" description="Run a backup to see it appear here." />
        ) : (
          <div className="[&>*:last-child]:border-b-0">
            {recentBackups.map((entry) => (
              <ActivityItem
                key={entry.id}
                leading={<ActivityDot tone={auditActionTone(entry.action)} />}
                title={<span>Automated backup completed successfully</span>}
                meta={new Date(entry.createdAt).toLocaleString('en-PH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
