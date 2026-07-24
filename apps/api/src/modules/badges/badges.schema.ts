import { z } from 'zod';

/**
 * Request validation for the badges module (Feature 2.4, Loop step 3 — Contract).
 *
 * Mirrored by hand in `apps/web/src/features/badges/types.ts` — same cross-workspace
 * convention as `members.schema.ts` / `organizations.schema.ts`.
 *
 * Contracted routes (mounted under `/api/v1`):
 *   GET    /badges                    — no query
 *   POST   /badges                    — createBadgeSchema
 *   PUT    /badges/:id                — updateBadgeSchema
 *   DELETE /badges/:id                — no body
 *   GET    /badges/member-options     — no query
 *   GET    /member-badges             — no query, scoped server-side by role
 *   POST   /member-badges             — recordMemberBadgeSchema
 *   PATCH  /member-badges/:id/verify  — no body
 *   GET    /achievements              — no query, scoped server-side by role
 *   POST   /achievements              — createAchievementSchema
 */

export const memberBadgeStatusSchema = z.enum(['in_progress', 'earned', 'verified']);

/** Empty string from the "No category" option means "no category" — not a validation error. */
const optionalUuid = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || z.string().uuid().safeParse(value).success, {
    message: 'Invalid category selection.',
  });

export const createBadgeSchema = z.object({
  name: z.string().trim().min(1, 'Badge name is required.'),
  description: z.string().trim().optional(),
  categoryId: optionalUuid,
  requiredPoints: z.coerce.number().int().min(0, 'Required points must be 0 or higher.'),
  requirements: z
    .array(z.string().trim().min(1))
    .min(1, 'Add at least one requirement.'),
});
export const updateBadgeSchema = createBadgeSchema;

export const recordMemberBadgeSchema = z.object({
  memberId: z.string().uuid('Select a member.'),
  badgeId: z.string().uuid('Select a badge.'),
  status: z.enum(['in_progress', 'earned']),
});

export const createAchievementSchema = z.object({
  memberId: z.string().uuid('Select a member.'),
  achievementName: z.string().trim().min(1, 'Achievement name is required.'),
  description: z.string().trim().optional(),
  achievedAt: z.string().trim().min(1, 'Date achieved is required.'),
});

export type MemberBadgeStatus = z.infer<typeof memberBadgeStatusSchema>;
export type CreateBadgeInput = z.infer<typeof createBadgeSchema>;
export type UpdateBadgeInput = z.infer<typeof updateBadgeSchema>;
export type RecordMemberBadgeInput = z.infer<typeof recordMemberBadgeSchema>;
export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;
