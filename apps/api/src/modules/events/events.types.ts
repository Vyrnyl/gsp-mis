import type { CreateEventInput, UpdateEventInput } from './events.schema';

export type CreateEventRequestBody = CreateEventInput;
export type UpdateEventRequestBody = UpdateEventInput;

export type EventStatus = 'upcoming' | 'completed';

interface EventRelations {
  category: { id: string; name: string } | null;
  organizer: { id: string; fullName: string } | null;
}

/**
 * `GET /events` row shape — shared by the list and calendar views. `status` is
 * derived server-side from `eventDate` vs. the current date, never stored (same
 * pattern as 1.5 dashboard's "Led/No Leader"). `troopNames` comes from the
 * organizer's own led troop(s) — the schema has no direct event→troop assignment.
 */
export interface EventSummary extends EventRelations {
  id: string;
  title: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  status: EventStatus;
  troopNames: string[];
  registeredCount: number;
}

/** `GET /events/:id` — adds the description, otherwise identical to the summary. */
export interface EventDetail extends EventSummary {
  description: string | null;
}

export interface ListEventsResponseBody {
  events: EventSummary[];
}

export interface EventResponseBody {
  event: EventDetail;
}

export type RegistrationStatus = 'registered' | 'cancelled';

/** `AttendanceRecord.attendanceStatus` narrowed to what this feature's checklist
 * writes — `excused`/`late` exist on the schema enum but are out of scope (build-plan
 * §2.2 specifies a present/absent toggle only). `null` = no record written yet. */
export type AttendanceMark = 'present' | 'absent' | null;

/** One row of `GET /events/:id/registrations` — a registration joined with its
 * member, troop, and (if recorded) attendance status. */
export interface ParticipantDto {
  registrationId: string;
  memberId: string;
  fullName: string;
  troop: { troopCode: string; name: string } | null;
  registrationStatus: RegistrationStatus;
  attendanceStatus: AttendanceMark;
}

/** Derived at request time from `AttendanceRecord` counts — the schema's
 * `AttendanceSummary` table stays unused (same simplification precedent as 1.5's/
 * 2.1's other server-computed fields; a stored summary would need to be kept in sync
 * on every attendance write for no real query benefit here). */
export interface AttendanceSummaryDto {
  totalExpected: number;
  totalPresent: number;
  totalAbsent: number;
  attendanceRate: number;
}

export interface ListParticipantsResponseBody {
  participants: ParticipantDto[];
  summary: AttendanceSummaryDto;
}

export interface ParticipantResponseBody {
  participant: ParticipantDto;
}
