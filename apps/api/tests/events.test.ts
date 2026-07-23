import { beforeEach, describe, expect, it, vi } from 'vitest';

import { eventsRepository } from '../src/modules/events/events.repository';
import { eventsService } from '../src/modules/events/events.service';
import type { CreateEventInput, ListEventsQuery, UpdateEventInput } from '../src/modules/events/events.schema';

const CATEGORY = { id: 'cat-1', name: 'Camping', description: null };
const ORGANIZER = {
  id: 'user-1',
  fullName: 'Liza Bagadiong',
  ledTroops: [{ id: 'troop-1', name: 'Troop 12 — Virac', troopCode: 'CAT-VIR-012' }],
};

function makeEvent(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'event-1',
    title: 'Annual Council Camp',
    description: 'Three-day overnight camp.',
    eventDate: new Date('2026-08-19T00:00:00Z'),
    startTime: new Date('1970-01-01T07:00:00Z'),
    endTime: null,
    location: 'Camp Igang, San Andres',
    organizerId: ORGANIZER.id,
    categoryId: CATEGORY.id,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    category: CATEGORY,
    organizer: ORGANIZER,
    _count: { registrations: 6 },
    ...overrides,
  };
}

const LIST_QUERY: ListEventsQuery = { status: 'all', page: 1, pageSize: 6 };

describe('eventsService', () => {
  beforeEach(() => vi.restoreAllMocks());

  describe('list', () => {
    it('maps rows to summaries, derives status from eventDate, and builds pagination meta', async () => {
      const past = makeEvent({ id: 'event-past', eventDate: new Date('2020-01-01T00:00:00Z') });
      const future = makeEvent({ id: 'event-future', eventDate: new Date('2099-01-01T00:00:00Z') });
      vi.spyOn(eventsRepository, 'list').mockResolvedValue({ rows: [past, future] as never, total: 2 });

      const result = await eventsService.list(LIST_QUERY);

      expect(result.events).toHaveLength(2);
      expect(result.events[0]).toMatchObject({ id: 'event-past', status: 'completed' });
      expect(result.events[1]).toMatchObject({ id: 'event-future', status: 'upcoming' });
      expect(result.meta).toEqual({ page: 1, pageSize: 6, totalItems: 2, totalPages: 1 });
    });

    it('derives troopNames from the organizer\'s led troops and registeredCount from the registration count', async () => {
      vi.spyOn(eventsRepository, 'list').mockResolvedValue({ rows: [makeEvent()] as never, total: 1 });

      const result = await eventsService.list(LIST_QUERY);

      expect(result.events[0]).toMatchObject({
        troopNames: ['Troop 12 — Virac'],
        registeredCount: 6,
        category: { id: CATEGORY.id, name: CATEGORY.name },
        organizer: { id: ORGANIZER.id, fullName: ORGANIZER.fullName },
      });
    });

    it('returns an empty troopNames array and null organizer/category when unassigned', async () => {
      vi.spyOn(eventsRepository, 'list').mockResolvedValue({
        rows: [makeEvent({ organizer: null, organizerId: null, category: null, categoryId: null })] as never,
        total: 1,
      });

      const result = await eventsService.list(LIST_QUERY);

      expect(result.events[0]).toMatchObject({ troopNames: [], organizer: null, category: null });
    });
  });

  describe('getById', () => {
    it('returns the full detail including description', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(makeEvent() as never);

      const result = await eventsService.getById('event-1');

      expect(result).toMatchObject({ id: 'event-1', description: 'Three-day overnight camp.' });
    });

    it('rejects an unknown id with 404', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(null);

      await expect(eventsService.getById('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('create', () => {
    const input: CreateEventInput = {
      title: 'New Event',
      eventDate: '2026-09-01',
      categoryId: CATEGORY.id,
    };

    it('rejects a category that does not exist', async () => {
      vi.spyOn(eventsRepository, 'findCategoryById').mockResolvedValue(null);

      await expect(eventsService.create(input)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects an organizer that does not exist', async () => {
      vi.spyOn(eventsRepository, 'findCategoryById').mockResolvedValue(CATEGORY as never);
      vi.spyOn(eventsRepository, 'findOrganizerById').mockResolvedValue(null);

      await expect(
        eventsService.create({ ...input, organizerId: 'missing-user' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('creates the event once the category (and organizer, if given) are valid', async () => {
      vi.spyOn(eventsRepository, 'findCategoryById').mockResolvedValue(CATEGORY as never);
      const createSpy = vi.spyOn(eventsRepository, 'create').mockResolvedValue(makeEvent() as never);

      const result = await eventsService.create(input);

      expect(createSpy).toHaveBeenCalledWith(input);
      expect(result.id).toBe('event-1');
    });
  });

  describe('update', () => {
    const input: UpdateEventInput = {
      title: 'Updated Event',
      eventDate: '2026-09-01',
      categoryId: CATEGORY.id,
    };

    it('rejects updating an event that does not exist', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(null);

      await expect(eventsService.update('missing', input)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('rejects a category that does not exist', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(makeEvent() as never);
      vi.spyOn(eventsRepository, 'findCategoryById').mockResolvedValue(null);

      await expect(eventsService.update('event-1', input)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('updates the event once found and valid', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(makeEvent() as never);
      vi.spyOn(eventsRepository, 'findCategoryById').mockResolvedValue(CATEGORY as never);
      const updateSpy = vi
        .spyOn(eventsRepository, 'update')
        .mockResolvedValue(makeEvent({ title: 'Updated Event' }) as never);

      const result = await eventsService.update('event-1', input);

      expect(updateSpy).toHaveBeenCalledWith('event-1', input);
      expect(result.title).toBe('Updated Event');
    });
  });

  describe('delete', () => {
    it('rejects deleting an event that does not exist', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(null);

      await expect(eventsService.delete('missing')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('deletes the event once found', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(makeEvent() as never);
      const deleteSpy = vi.spyOn(eventsRepository, 'delete').mockResolvedValue(undefined as never);

      await eventsService.delete('event-1');

      expect(deleteSpy).toHaveBeenCalledWith('event-1');
    });
  });

  const MEMBER = {
    id: 'member-1',
    firstName: 'Andrea',
    lastName: 'Kalaw',
    troop: { troopCode: 'CAT-VIR-012', name: 'Troop 12 — Virac' },
  };

  function makeRegistration(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'reg-1',
      eventId: 'event-1',
      memberId: MEMBER.id,
      registeredById: 'user-1',
      registrationDate: new Date('2026-01-01T00:00:00Z'),
      status: 'registered',
      member: MEMBER,
      ...overrides,
    };
  }

  function makeAttendanceRecord(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'att-1',
      eventId: 'event-1',
      memberId: MEMBER.id,
      attendanceStatus: 'present',
      recordedById: 'user-1',
      recordedAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    };
  }

  describe('listParticipants', () => {
    it('rejects an unknown event with 404', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(null);

      await expect(eventsService.listParticipants('missing')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('joins registrations with attendance and computes the summary', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(makeEvent() as never);
      vi.spyOn(eventsRepository, 'findRegistrationsForEvent').mockResolvedValue([
        makeRegistration(),
        makeRegistration({ id: 'reg-2', memberId: 'member-2', member: { ...MEMBER, id: 'member-2', firstName: 'Bea' } }),
      ] as never);
      vi.spyOn(eventsRepository, 'findAttendanceForEvent').mockResolvedValue([
        makeAttendanceRecord(),
      ] as never);

      const result = await eventsService.listParticipants('event-1');

      expect(result.participants).toHaveLength(2);
      expect(result.participants[0]).toMatchObject({
        registrationId: 'reg-1',
        fullName: 'Andrea Kalaw',
        troop: { troopCode: 'CAT-VIR-012', name: 'Troop 12 — Virac' },
        registrationStatus: 'registered',
        attendanceStatus: 'present',
      });
      expect(result.participants[1]).toMatchObject({ attendanceStatus: null });
      expect(result.summary).toEqual({
        totalExpected: 2,
        totalPresent: 1,
        totalAbsent: 0,
        attendanceRate: 50,
      });
    });

    it('excludes cancelled registrations from the summary', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(makeEvent() as never);
      vi.spyOn(eventsRepository, 'findRegistrationsForEvent').mockResolvedValue([
        makeRegistration({ status: 'cancelled' }),
      ] as never);
      vi.spyOn(eventsRepository, 'findAttendanceForEvent').mockResolvedValue([] as never);

      const result = await eventsService.listParticipants('event-1');

      expect(result.participants[0]).toMatchObject({ registrationStatus: 'cancelled' });
      expect(result.summary).toEqual({ totalExpected: 0, totalPresent: 0, totalAbsent: 0, attendanceRate: 0 });
    });
  });

  describe('registerParticipant', () => {
    it('rejects an unknown event with 404', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(null);

      await expect(
        eventsService.registerParticipant('missing', { memberId: MEMBER.id }, 'user-1'),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('rejects an unknown member with 400', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(makeEvent() as never);
      vi.spyOn(eventsRepository, 'findMemberById').mockResolvedValue(null);

      await expect(
        eventsService.registerParticipant('event-1', { memberId: 'missing' }, 'user-1'),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('upserts the registration and returns the joined participant', async () => {
      vi.spyOn(eventsRepository, 'findById').mockResolvedValue(makeEvent() as never);
      vi.spyOn(eventsRepository, 'findMemberById').mockResolvedValue(MEMBER as never);
      const upsertSpy = vi
        .spyOn(eventsRepository, 'upsertRegistration')
        .mockResolvedValue(makeRegistration() as never);
      vi.spyOn(eventsRepository, 'findAttendanceForEvent').mockResolvedValue([] as never);

      const result = await eventsService.registerParticipant('event-1', { memberId: MEMBER.id }, 'user-1');

      expect(upsertSpy).toHaveBeenCalledWith('event-1', MEMBER.id, 'user-1');
      expect(result).toMatchObject({ registrationStatus: 'registered', fullName: 'Andrea Kalaw' });
    });
  });

  describe('updateRegistrationStatus', () => {
    it('rejects when no registration exists for this event/member', async () => {
      vi.spyOn(eventsRepository, 'findRegistration').mockResolvedValue(null);

      await expect(
        eventsService.updateRegistrationStatus('event-1', 'member-1', { status: 'cancelled' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('cancels an existing registration', async () => {
      vi.spyOn(eventsRepository, 'findRegistration').mockResolvedValue(makeRegistration() as never);
      vi.spyOn(eventsRepository, 'updateRegistrationStatus').mockResolvedValue(
        makeRegistration({ status: 'cancelled' }) as never,
      );
      vi.spyOn(eventsRepository, 'findAttendanceForEvent').mockResolvedValue([] as never);

      const result = await eventsService.updateRegistrationStatus('event-1', MEMBER.id, { status: 'cancelled' });

      expect(result.registrationStatus).toBe('cancelled');
    });

    it('reactivates a cancelled registration', async () => {
      vi.spyOn(eventsRepository, 'findRegistration').mockResolvedValue(
        makeRegistration({ status: 'cancelled' }) as never,
      );
      vi.spyOn(eventsRepository, 'updateRegistrationStatus').mockResolvedValue(makeRegistration() as never);
      vi.spyOn(eventsRepository, 'findAttendanceForEvent').mockResolvedValue([] as never);

      const result = await eventsService.updateRegistrationStatus('event-1', MEMBER.id, { status: 'registered' });

      expect(result.registrationStatus).toBe('registered');
    });
  });
});
