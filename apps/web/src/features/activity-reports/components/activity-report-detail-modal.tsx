'use client';

import type { ReactNode } from 'react';

import { Modal } from '@/shared/components/ui';

import type { ActivityReportSummary } from '../types';
import { ActivityReportStatusBadge } from './activity-report-status-badge';

export interface ActivityReportDetailModalProps {
  report: ActivityReportSummary | null;
  onClose: () => void;
}

function toDisplayDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-[0.78rem] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1 text-[0.92rem] text-ink">{children}</div>
    </div>
  );
}

/** Read-only detail view — Loop step 1. Same "modal, not a route" precedent as `ApprovalReviewModal`. */
export function ActivityReportDetailModal({ report, onClose }: ActivityReportDetailModalProps) {
  return (
    <Modal isOpen={report !== null} onClose={onClose} title="Activity Report" size="lg">
      {report ? (
        <div>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-lg font-semibold text-ink">{report.event.title}</p>
              <p className="text-[0.85rem] text-muted">
                {report.troopName ?? 'No troop'} · Submitted by {report.submittedBy.fullName}
              </p>
            </div>
            <ActivityReportStatusBadge status={report.status} />
          </div>

          <Field label="Submitted">{toDisplayDateTime(report.submittedAt)}</Field>
          <Field label="Summary">
            <p className="whitespace-pre-wrap">{report.summary}</p>
          </Field>
          <Field label="Participation Notes">
            <p className="whitespace-pre-wrap">{report.participationNotes || '—'}</p>
          </Field>
          <Field label="Outcomes">
            <p className="whitespace-pre-wrap">{report.outcomes || '—'}</p>
          </Field>
        </div>
      ) : null}
    </Modal>
  );
}
