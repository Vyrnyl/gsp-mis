import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';
import type { CreateEventInput, ListEventsQuery, UpdateEventInput } from './events.schema';

const eventInclude = {
  category: true,
  organizer: { include: { ledTroops: true } },
  _count: { select: { registrations: true } },
} satisfies Prisma.EventInclude;

export type EventWithRelations = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

function buildWhere(query: ListEventsQuery, startOfToday: Date): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {};

  if (query.status === 'upcoming') where.eventDate = { gte: startOfToday };
  if (query.status === 'completed') where.eventDate = { lt: startOfToday };
  if (query.categoryId) where.categoryId = query.categoryId;

  if (query.search) {
    const term = query.search.trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { location: { contains: term, mode: 'insensitive' } },
    ];
  }

  return where;
}

export const eventsRepository = {
  async list(
    query: ListEventsQuery,
    startOfToday: Date,
  ): Promise<{ rows: EventWithRelations[]; total: number }> {
    const where = buildWhere(query, startOfToday);
    const [rows, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: eventInclude,
        orderBy: { eventDate: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.event.count({ where }),
    ]);
    return { rows, total };
  },

  findById(id: string) {
    return prisma.event.findUnique({ where: { id }, include: eventInclude });
  },

  findCategoryById(id: string) {
    return prisma.activityCategory.findUnique({ where: { id } });
  },

  findOrganizerById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(input: CreateEventInput) {
    return prisma.event.create({
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        eventDate: new Date(input.eventDate),
        startTime: input.startTime ? new Date(`1970-01-01T${input.startTime}:00Z`) : null,
        endTime: input.endTime ? new Date(`1970-01-01T${input.endTime}:00Z`) : null,
        location: input.location?.trim() || null,
        categoryId: input.categoryId,
        organizerId: input.organizerId || null,
      },
      include: eventInclude,
    });
  },

  update(id: string, input: UpdateEventInput) {
    return prisma.event.update({
      where: { id },
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        eventDate: new Date(input.eventDate),
        startTime: input.startTime ? new Date(`1970-01-01T${input.startTime}:00Z`) : null,
        endTime: input.endTime ? new Date(`1970-01-01T${input.endTime}:00Z`) : null,
        location: input.location?.trim() || null,
        categoryId: input.categoryId,
        organizerId: input.organizerId || null,
      },
      include: eventInclude,
    });
  },

  delete(id: string) {
    return prisma.event.delete({ where: { id } });
  },

  findRegistrationsForEvent(eventId: string) {
    return prisma.eventRegistration.findMany({
      where: { eventId },
      include: { member: { include: { troop: true } } },
      orderBy: [{ member: { lastName: 'asc' } }, { member: { firstName: 'asc' } }],
    });
  },

  /** Queried directly rather than through the attendance module (modules share the
   * `prisma` singleton, not each other's repositories — same convention dashboard's
   * cross-domain reads already use). */
  findAttendanceForEvent(eventId: string) {
    return prisma.attendanceRecord.findMany({ where: { eventId } });
  },

  findRegistration(eventId: string, memberId: string) {
    return prisma.eventRegistration.findUnique({
      where: { eventId_memberId: { eventId, memberId } },
      include: { member: { include: { troop: true } } },
    });
  },

  findMemberById(id: string) {
    return prisma.member.findUnique({ where: { id }, include: { troop: true } });
  },

  /** Registering a previously-cancelled member reactivates the same row (the unique
   * `[eventId, memberId]` constraint means a second `create` would fail) rather than
   * inserting a duplicate — same restore-not-recreate idiom as members archive/restore. */
  upsertRegistration(eventId: string, memberId: string, registeredById: string) {
    return prisma.eventRegistration.upsert({
      where: { eventId_memberId: { eventId, memberId } },
      create: { eventId, memberId, registeredById, status: 'registered' },
      update: { status: 'registered' },
      include: { member: { include: { troop: true } } },
    });
  },

  updateRegistrationStatus(eventId: string, memberId: string, status: 'registered' | 'cancelled') {
    return prisma.eventRegistration.update({
      where: { eventId_memberId: { eventId, memberId } },
      data: { status },
      include: { member: { include: { troop: true } } },
    });
  },
};
