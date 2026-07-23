export type ActivityReportStatus = 'submitted' | 'reviewed';

export interface ReportableEvent {
  id: string;
  title: string;
  eventDate: string; // ISO date
}

export interface ActivityReportSubmitter {
  id: string;
  fullName: string;
}

/** One row in the reports table, and the shape shown in the detail modal. */
export interface ActivityReportSummary {
  id: string;
  event: ReportableEvent;
  submittedBy: ActivityReportSubmitter;
  /** Troop led by the submitter, if any — same "derived, not stored" pattern as events' troopNames. */
  troopName: string | null;
  summary: string;
  participationNotes: string | null;
  outcomes: string | null;
  status: ActivityReportStatus;
  submittedAt: string; // ISO datetime
}

export interface ActivityReportFormValues {
  eventId: string;
  summary: string;
  participationNotes: string;
  outcomes: string;
}
