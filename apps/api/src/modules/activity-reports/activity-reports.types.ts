import type { CreateActivityReportInput } from './activity-reports.schema';

export type CreateActivityReportRequestBody = CreateActivityReportInput;

export type ActivityReportStatus = 'submitted' | 'reviewed';

/**
 * One row of `GET /activity-reports` and the shape of `GET /activity-reports/:id`
 * (no separate "detail" type — the record has nothing extra to add beyond the
 * summary, unlike events' description). `troopName` is derived from the submitter's
 * own led troop, same "derived, not stored" pattern as events' `troopNames`.
 */
export interface ActivityReportSummary {
  id: string;
  event: { id: string; title: string; eventDate: string };
  submittedBy: { id: string; fullName: string };
  troopName: string | null;
  summary: string;
  participationNotes: string | null;
  outcomes: string | null;
  status: ActivityReportStatus;
  submittedAt: string;
}

export interface ListActivityReportsResponseBody {
  activityReports: ActivityReportSummary[];
}

export interface ActivityReportResponseBody {
  activityReport: ActivityReportSummary;
}
