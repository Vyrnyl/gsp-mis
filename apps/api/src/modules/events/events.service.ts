import type { AttendanceRecord, EventRegistration, Member, Troop } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { buildPaginationMeta, type PaginationMeta } from '../../shared/utils/api-response';
import type { EventWithRelations } from './events.repository';
import { eventsRepository } from './events.repository';
import type {
  CreateEventInput,
  ListEventsQuery,
  RegisterParticipantInput,
  UpdateEventInput,
  UpdateRegistrationStatusInput,
} from './events.schema';
import type {
  AttendanceSummaryDto,
  EventDetail,
  EventStatus,
  EventSummary,
  ParticipantDto,
} from './events.types';

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function toTimeString(time: Date | null): string | null {
  return time ? time.toISOString().slice(11, 16) : null;
}

function toStatus(eventDate: Date, today: Date): EventStatus {
  return eventDate < today ? 'completed' : 'upcoming';
}

function toSummary(event: EventWithRelations, today: Date): EventSummary {
  return {
    id: event.id,
    title: event.title,
    eventDate: event.eventDate.toISOString().slice(0, 10),
    startTime: toTimeString(event.startTime),
    endTime: toTimeString(event.endTime),
    location: event.location,
    status: toStatus(event.eventDate, today),
    category: event.category ? { id: event.category.id, name: event.category.name } : null,
    organizer: event.organizer ? { id: event.organizer.id, fullName: event.organizer.fullName } : null,
    troopNames: event.organizer?.ledTroops.map((troop) => troop.name) ?? [],
    registeredCount: event._count.registrations,
  };
}

function toDetail(event: EventWithRelations, today: Date): EventDetail {
  return { ...toSummary(event, today), description: event.description };
}

async function requireEvent(id: string): Promise<EventWithRelations> {
  const event = await eventsRepository.findById(id);
  if (!event) throw ApiError.notFound('Event not found.');
  return event;
}

type RegistrationWithMember = EventRegistration & { member: Member & { troop: Troop | null } };

function toParticipant(
  registration: RegistrationWithMember,
  attendanceByMemberId: Map<string, AttendanceRecord>,
): ParticipantDto {
  const { member } = registration;
  const record = attendanceByMemberId.get(member.id);
  return {
    registrationId: registration.id,
    memberId: member.id,
    fullName: `${member.firstName} ${member.lastName}`,
    troop: member.troop ? { troopCode: member.troop.troopCode, name: member.troop.name } : null,
    registrationStatus: registration.status === 'cancelled' ? 'cancelled' : 'registered',
    // `excused`/`late` fold into `absent` — out of this feature's scope (events.types.ts).
    attendanceStatus: record ? (record.attendanceStatus === 'present' ? 'present' : 'absent') : null,
  };
}

function summarize(participants: ParticipantDto[]): AttendanceSummaryDto {
  const active = participants.filter((p) => p.registrationStatus !== 'cancelled');
  const totalPresent = active.filter((p) => p.attendanceStatus === 'present').length;
  const totalAbsent = active.filter((p) => p.attendanceStatus === 'absent').length;
  const totalExpected = active.length;
  return {
    totalExpected,
    totalPresent,
    totalAbsent,
    attendanceRate: totalExpected === 0 ? 0 : Math.round((totalPresent / totalExpected) * 100),
  };
}

async function requireValidRelations(input: CreateEventInput | UpdateEventInput): Promise<void> {
  const category = await eventsRepository.findCategoryById(input.categoryId);
  if (!category) throw ApiError.badRequest('Selected category does not exist.');

  if (input.organizerId) {
    const organizer = await eventsRepository.findOrganizerById(input.organizerId);
    if (!organizer) throw ApiError.badRequest('Selected organizer does not exist.');
  }
}

export const eventsService = {
  async list(query: ListEventsQuery): Promise<{ events: EventSummary[]; meta: PaginationMeta }> {
    const today = startOfToday();
    const { rows, total } = await eventsRepository.list(query, today);
    return {
      events: rows.map((row) => toSummary(row, today)),
      meta: buildPaginationMeta(query.page, query.pageSize, total),
    };
  },

  async getById(id: string): Promise<EventDetail> {
    const event = await requireEvent(id);
    return toDetail(event, startOfToday());
  },

  async create(input: CreateEventInput): Promise<EventDetail> {
    await requireValidRelations(input);
    const created = await eventsRepository.create(input);
    return toDetail(created, startOfToday());
  },

  async update(id: string, input: UpdateEventInput): Promise<EventDetail> {
    await requireEvent(id);
    await requireValidRelations(input);
    const updated = await eventsRepository.update(id, input);
    return toDetail(updated, startOfToday());
  },

  async delete(id: string): Promise<void> {
    await requireEvent(id);
    await eventsRepository.delete(id);
  },

  async listParticipants(
    eventId: string,
  ): Promise<{ participants: ParticipantDto[]; summary: AttendanceSummaryDto }> {
    await requireEvent(eventId);
    const [registrations, attendance] = await Promise.all([
      eventsRepository.findRegistrationsForEvent(eventId),
      eventsRepository.findAttendanceForEvent(eventId),
    ]);
    const attendanceByMemberId = new Map(attendance.map((record) => [record.memberId, record]));
    const participants = registrations.map((registration) =>
      toParticipant(registration, attendanceByMemberId),
    );
    return { participants, summary: summarize(participants) };
  },

  async registerParticipant(
    eventId: string,
    input: RegisterParticipantInput,
    registeredById: string,
  ): Promise<ParticipantDto> {
    await requireEvent(eventId);
    const member = await eventsRepository.findMemberById(input.memberId);
    if (!member) throw ApiError.badRequest('Selected member does not exist.');

    const registration = await eventsRepository.upsertRegistration(eventId, input.memberId, registeredById);
    const attendance = await eventsRepository.findAttendanceForEvent(eventId);
    const attendanceByMemberId = new Map(attendance.map((record) => [record.memberId, record]));
    return toParticipant(registration, attendanceByMemberId);
  },

  async updateRegistrationStatus(
    eventId: string,
    memberId: string,
    input: UpdateRegistrationStatusInput,
  ): Promise<ParticipantDto> {
    const existing = await eventsRepository.findRegistration(eventId, memberId);
    if (!existing) throw ApiError.notFound('This member is not registered for this event.');

    const updated = await eventsRepository.updateRegistrationStatus(eventId, memberId, input.status);
    const attendance = await eventsRepository.findAttendanceForEvent(eventId);
    const attendanceByMemberId = new Map(attendance.map((record) => [record.memberId, record]));
    return toParticipant(updated, attendanceByMemberId);
  },
};
