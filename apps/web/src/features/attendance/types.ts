import type { EventStatus } from '@/features/events/types';

/** Registration lifecycle this feature actually drives — `waitlisted` exists on the
 * schema's `RegistrationStatus` enum but nothing in the app assigns event capacity,
 * so it's never produced here (documented scope note, same treatment as the
 * `excused`/`late` attendance statuses below). */
export type RegistrationStatus = 'registered' | 'cancelled';

/** `null` = no `AttendanceRecord` written yet. The schema's `AttendanceStatus` enum
 * also has `excused`/`late`; this feature's checklist only ever writes present/absent
 * (build-plan.md §2.2 specifies a present/absent `ToggleSwitch`), so those two stay
 * unused pending a future feature that needs them. */
export type AttendanceMark = 'present' | 'absent' | null;

export interface AttendanceEventOption {
  id: string;
  title: string;
  eventDate: string; // ISO date
  status: EventStatus;
}

export interface Participant {
  registrationId: string;
  memberId: string;
  fullName: string;
  troop: { troopCode: string; name: string } | null;
  registrationStatus: RegistrationStatus;
  attendanceStatus: AttendanceMark;
}

/** Derived at request time from `AttendanceRecord` counts, never stored — same
 * simplification precedent as 1.5's/2.1's other server-computed fields. The schema's
 * `AttendanceSummary` table stays unused by this feature. */
export interface AttendanceSummary {
  totalExpected: number;
  totalPresent: number;
  totalAbsent: number;
  attendanceRate: number; // 0–100, present / totalExpected
}

/** One row in the "register a participant" picker — a slice of `MemberSummary`. */
export interface RegistrableMember {
  id: string;
  fullName: string;
  troopName: string | null;
}
