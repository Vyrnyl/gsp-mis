import { ApiError } from '../../shared/utils/api-error';
import { attendanceRepository } from './attendance.repository';
import type { RecordAttendanceInput } from './attendance.schema';
import type { AttendanceRecordDto } from './attendance.types';

export const attendanceService = {
  async record(input: RecordAttendanceInput, recordedById: string): Promise<AttendanceRecordDto> {
    const event = await attendanceRepository.findEventById(input.eventId);
    if (!event) throw ApiError.notFound('Event not found.');

    const registration = await attendanceRepository.findActiveRegistration(input.eventId, input.memberId);
    if (!registration || registration.status === 'cancelled') {
      throw ApiError.badRequest('This member is not registered for this event.');
    }

    const record = await attendanceRepository.upsertRecord(
      input.eventId,
      input.memberId,
      input.status,
      recordedById,
    );
    return { eventId: record.eventId, memberId: record.memberId, status: input.status };
  },
};
