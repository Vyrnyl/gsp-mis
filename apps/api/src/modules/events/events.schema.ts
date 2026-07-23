import { z } from 'zod';

/**
 * Request validation for the events module (Feature 2.1, Loop step 3 — Contract).
 *
 * Routes are not wired yet (Loop step 4); these schemas are the source of truth for
 * `events.types.ts` below. Mirrored by hand in `apps/web/src/features/events/types.ts`
 * — same cross-workspace convention as `auth.schema.ts`/`members.schema.ts`.
 *
 * Contracted routes (mounted under `/api/v1/events`):
 *   GET    /       — listEventsQuerySchema
 *   GET    /:id    — no body
 *   POST   /       — createEventSchema
 *   PUT    /:id    — updateEventSchema
 *   DELETE /:id    — no body
 */

export const eventStatusFilterSchema = z.enum(['all', 'upcoming', 'completed']);

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time.');

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.');

const eventBaseSchema = z
  .object({
    title: z.string().trim().min(1, 'Event title is required.'),
    description: z.string().trim().optional(),
    eventDate: dateSchema,
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    location: z.string().trim().optional(),
    categoryId: z.string().uuid('Category is required.'),
    organizerId: z.string().uuid().optional(),
  })
  .refine((data) => !data.startTime || !data.endTime || data.endTime > data.startTime, {
    message: 'End time must be after the start time.',
    path: ['endTime'],
  });

/** Same shape as create — edit is a full-record replace, not a patch (same convention as members). */
export const createEventSchema = eventBaseSchema;
export const updateEventSchema = eventBaseSchema;

export const listEventsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: eventStatusFilterSchema.default('all'),
  categoryId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(6),
});

export type EventStatusFilter = z.infer<typeof eventStatusFilterSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

/**
 * Registrations — Feature 2.2, extending this module rather than creating a new one
 * (same precedent as 1.4 extending `members` for approvals): the route path nests
 * under `/events/:id`, and `EventRegistration` is a sub-resource of `Event`.
 *
 * Contracted routes:
 *   GET   /:id/registrations               — no body
 *   POST  /:id/registrations               — registerParticipantSchema
 *   PATCH /:id/registrations/:memberId     — updateRegistrationStatusSchema
 */

export const registerParticipantSchema = z.object({
  memberId: z.string().uuid('Select a member to register.'),
});

export const registrationStatusSchema = z.enum(['registered', 'cancelled']);

export const updateRegistrationStatusSchema = z.object({
  status: registrationStatusSchema,
});

export type RegisterParticipantInput = z.infer<typeof registerParticipantSchema>;
export type UpdateRegistrationStatusInput = z.infer<typeof updateRegistrationStatusSchema>;
