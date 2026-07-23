import type { AttendanceMark } from './attendance.schema';

export interface AttendanceRecordDto {
  eventId: string;
  memberId: string;
  status: AttendanceMark;
}

export interface AttendanceResponseBody {
  record: AttendanceRecordDto;
}
