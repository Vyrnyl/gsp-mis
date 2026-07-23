import { prisma } from '../../config/prisma';
import type { AttendanceMark } from './attendance.schema';

export const attendanceRepository = {
  findEventById(eventId: string) {
    return prisma.event.findUnique({ where: { id: eventId } });
  },

  /** Attendance can only be recorded for an active registration — queried directly
   * against `eventRegistration` rather than through the events module (modules share
   * the `prisma` singleton, not each other's repositories; same convention
   * dashboard's cross-domain reads already use). */
  findActiveRegistration(eventId: string, memberId: string) {
    return prisma.eventRegistration.findUnique({
      where: { eventId_memberId: { eventId, memberId } },
    });
  },

  upsertRecord(eventId: string, memberId: string, status: AttendanceMark, recordedById: string) {
    return prisma.attendanceRecord.upsert({
      where: { eventId_memberId: { eventId, memberId } },
      create: { eventId, memberId, attendanceStatus: status, recordedById },
      update: { attendanceStatus: status, recordedById, recordedAt: new Date() },
    });
  },
};
