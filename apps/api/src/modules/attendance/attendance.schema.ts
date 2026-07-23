import { z } from 'zod';

/**
 * Request validation for the attendance module (Feature 2.2, Loop step 3 — Contract).
 *
 * Contracted routes (mounted under `/api/v1/attendance`):
 *   POST / — recordAttendanceSchema
 *
 * Reads live on the `events` module instead (`GET /events/:id/registrations` already
 * returns each participant's attendance status joined with their registration — see
 * events.schema.ts's note on why registrations/attendance for one event share a
 * single response rather than two round trips).
 */

export const attendanceMarkSchema = z.enum(['present', 'absent']);

export const recordAttendanceSchema = z.object({
  eventId: z.string().uuid('Select an event.'),
  memberId: z.string().uuid('Select a member.'),
  status: attendanceMarkSchema,
});

export type AttendanceMark = z.infer<typeof attendanceMarkSchema>;
export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;
