import { z } from 'zod';

/**
 * Request validation for the members module (Feature 1.3, Loop step 3 — Contract).
 *
 * Routes are not wired yet (Loop step 4); these schemas are the source of truth for
 * `members.types.ts` below. Mirrored by hand in `apps/web/src/features/members/types.ts`
 * — same cross-workspace convention as `auth.schema.ts`.
 *
 * Contracted routes (mounted under `/api/v1/members`):
 *   GET    /             — listMembersQuerySchema
 *   POST   /              — createMemberSchema
 *   PUT    /:id           — updateMemberSchema
 *   PATCH  /:id/archive    — no body
 *   PATCH  /:id/restore    — no body
 *   POST   /:id/renew      — renewMembershipSchema
 */

export const memberTypeSchema = z.enum(['scout', 'adult_leader']);
export const genderSchema = z.enum(['female', 'male', 'other', 'undisclosed']);
export const memberStatusSchema = z.enum([
  'pending',
  'active',
  'expiring',
  'expired',
  'archived',
  'rejected',
]);

const memberBaseSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  birthDate: z.string().trim().min(1, 'Birthdate is required.'),
  gender: genderSchema.default('female'),
  email: z.string().trim().email('Enter a valid email address.').optional().or(z.literal('')),
  phoneNumber: z.string().trim().optional(),
  address: z.string().trim().optional(),
  troopId: z.string().uuid('Select a troop.'),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

/**
 * Discriminated by `memberType` — build-plan.md §1.3 requires one modal that handles
 * both registration types with different required fields, same technique as
 * `signupSchema`'s `role` discriminated union.
 */
export const createMemberSchema = z.discriminatedUnion('memberType', [
  memberBaseSchema.extend({
    memberType: z.literal('scout'),
    scoutLevelId: z.string().uuid('Scout level is required.'),
  }),
  memberBaseSchema.extend({
    memberType: z.literal('adult_leader'),
  }),
]);

/** Same shape as create — edit is a full-record replace, not a patch. */
export const updateMemberSchema = createMemberSchema;

export const listMembersQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: memberStatusSchema.optional(),
  memberType: memberTypeSchema.optional(),
  troopId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const renewMembershipSchema = z
  .object({
    startDate: z.string().trim().min(1, 'Start date is required.'),
    endDate: z.string().trim().min(1, 'End date is required.'),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after the start date.',
    path: ['endDate'],
  });

export type MemberType = z.infer<typeof memberTypeSchema>;
export type Gender = z.infer<typeof genderSchema>;
export type MemberStatusName = z.infer<typeof memberStatusSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
export type RenewMembershipInput = z.infer<typeof renewMembershipSchema>;
