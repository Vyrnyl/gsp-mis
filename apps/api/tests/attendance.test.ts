import { beforeEach, describe, expect, it, vi } from 'vitest';

import { attendanceRepository } from '../src/modules/attendance/attendance.repository';
import { attendanceService } from '../src/modules/attendance/attendance.service';
import type { RecordAttendanceInput } from '../src/modules/attendance/attendance.schema';

const INPUT: RecordAttendanceInput = { eventId: 'event-1', memberId: 'member-1', status: 'present' };

const REGISTRATION = { id: 'reg-1', eventId: 'event-1', memberId: 'member-1', status: 'registered' };

describe('attendanceService', () => {
  beforeEach(() => vi.restoreAllMocks());

  describe('record', () => {
    it('rejects an unknown event with 404', async () => {
      vi.spyOn(attendanceRepository, 'findEventById').mockResolvedValue(null);

      await expect(attendanceService.record(INPUT, 'user-1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('rejects a member who is not registered for the event', async () => {
      vi.spyOn(attendanceRepository, 'findEventById').mockResolvedValue({ id: 'event-1' } as never);
      vi.spyOn(attendanceRepository, 'findActiveRegistration').mockResolvedValue(null);

      await expect(attendanceService.record(INPUT, 'user-1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects a member whose registration was cancelled', async () => {
      vi.spyOn(attendanceRepository, 'findEventById').mockResolvedValue({ id: 'event-1' } as never);
      vi.spyOn(attendanceRepository, 'findActiveRegistration').mockResolvedValue({
        ...REGISTRATION,
        status: 'cancelled',
      } as never);

      await expect(attendanceService.record(INPUT, 'user-1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('upserts the attendance record once the member is actively registered', async () => {
      vi.spyOn(attendanceRepository, 'findEventById').mockResolvedValue({ id: 'event-1' } as never);
      vi.spyOn(attendanceRepository, 'findActiveRegistration').mockResolvedValue(REGISTRATION as never);
      const upsertSpy = vi.spyOn(attendanceRepository, 'upsertRecord').mockResolvedValue({
        id: 'att-1',
        eventId: 'event-1',
        memberId: 'member-1',
        attendanceStatus: 'present',
        recordedById: 'user-1',
        recordedAt: new Date('2026-01-01T00:00:00Z'),
      } as never);

      const result = await attendanceService.record(INPUT, 'user-1');

      expect(upsertSpy).toHaveBeenCalledWith('event-1', 'member-1', 'present', 'user-1');
      expect(result).toEqual({ eventId: 'event-1', memberId: 'member-1', status: 'present' });
    });
  });
});
