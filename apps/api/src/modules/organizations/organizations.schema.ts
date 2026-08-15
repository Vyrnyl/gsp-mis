import { z } from 'zod';

/**
 * Request validation for the organizations module (Feature 1.6, Loop step 3 — Contract).
 *
 * Mirrored by hand in `apps/web/src/features/organizations/types.ts` — same
 * cross-workspace convention as `auth.schema.ts` / `members.schema.ts`.
 *
 * Contracted routes (mounted under `/api/v1/organizations`):
 *   GET    /councils                    — no query
 *   POST   /councils                    — createCouncilSchema
 *   PUT    /councils/:id                — updateCouncilSchema
 *   DELETE /councils/:id                — no body
 *   GET    /troops                      — no query (widened for 1.6; 1.3's picker ignores extra fields)
 *   POST   /troops                      — createTroopSchema
 *   PUT    /troops/:id                  — updateTroopSchema
 *   DELETE /troops/:id                  — no body
 *   GET    /troop-leaders               — no query
 *   GET    /scout-levels                — no query (widened for 1.6)
 *   POST   /scout-levels                — createScoutLevelSchema
 *   PUT    /scout-levels/:id            — updateScoutLevelSchema
 *   DELETE /scout-levels/:id            — no body
 *   GET    /badge-categories            — no query
 *   POST   /badge-categories            — createBadgeCategorySchema
 *   PUT    /badge-categories/:id        — updateBadgeCategorySchema
 *   DELETE /badge-categories/:id        — no body
 *   GET    /activity-categories         — no query
 *   POST   /activity-categories         — createCategorySchema
 *   PUT    /activity-categories/:id     — updateCategorySchema
 *   DELETE /activity-categories/:id     — no body
 *   GET    /schools                     — no query (widened for 1.3's registration-form picker)
 *   POST   /schools                     — createSchoolSchema
 *   PUT    /schools/:id                 — updateSchoolSchema
 *   DELETE /schools/:id                 — no body
 */

/** Empty string from the UI's "No Leader Assigned" option means "no leader" — not a validation error. */
const optionalUuid = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || z.string().uuid().safeParse(value).success, {
    message: 'Invalid leader selection.',
  });

export const createCouncilSchema = z.object({
  name: z.string().trim().min(1, 'Council name is required.'),
  description: z.string().trim().optional(),
});
export const updateCouncilSchema = createCouncilSchema;

export const createTroopSchema = z.object({
  troopCode: z.string().trim().min(1, 'Troop code is required.'),
  name: z.string().trim().min(1, 'Troop name is required.'),
  councilId: z.string().uuid('Select a council.'),
  leaderId: optionalUuid,
});
export const updateTroopSchema = z.object({
  name: z.string().trim().min(1, 'Troop name is required.'),
  councilId: z.string().uuid('Select a council.'),
  leaderId: optionalUuid,
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  description: z.string().trim().optional(),
});
export const updateCategorySchema = createCategorySchema;

/**
 * Curated icon keys an Admin may assign to a badge category. Hand-mirrored in
 * `apps/web/src/shared/components/icons.ts` (`BADGE_CATEGORY_ICONS`) — the web side
 * owns the key → component mapping; this side only guarantees the key is one we know.
 * Persisting a key rather than a `react-icons` name keeps the icon set swappable.
 */
export const BADGE_CATEGORY_ICON_KEYS = [
  'award',
  'heart',
  'compass',
  'lifebuoy',
  'flag',
  'music',
  'book',
  'globe',
  'tool',
  'star',
  'sun',
  'droplet',
] as const;

export const DEFAULT_BADGE_CATEGORY_ICON = 'award';

/** Badge categories carry an icon; scout levels and activity categories do not. */
export const createBadgeCategorySchema = createCategorySchema.extend({
  icon: z
    .enum(BADGE_CATEGORY_ICON_KEYS, { message: 'Select an icon from the list.' })
    .default(DEFAULT_BADGE_CATEGORY_ICON),
});
export const updateBadgeCategorySchema = createBadgeCategorySchema;

export const createScoutLevelSchema = createCategorySchema.extend({
  orderNumber: z.coerce.number().int().min(1, 'Order must be 1 or higher.'),
});
export const updateScoutLevelSchema = createScoutLevelSchema;

/** Scoped to a council, same shape as a troop minus its code/leader — see `createTroopSchema`. */
export const createSchoolSchema = z.object({
  name: z.string().trim().min(1, 'School name is required.'),
  councilId: z.string().uuid('Select a council.'),
});
export const updateSchoolSchema = createSchoolSchema;

export type CreateCouncilInput = z.infer<typeof createCouncilSchema>;
export type UpdateCouncilInput = z.infer<typeof updateCouncilSchema>;
export type CreateTroopInput = z.infer<typeof createTroopSchema>;
export type UpdateTroopInput = z.infer<typeof updateTroopSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateBadgeCategoryInput = z.infer<typeof createBadgeCategorySchema>;
export type UpdateBadgeCategoryInput = z.infer<typeof updateBadgeCategorySchema>;
export type BadgeCategoryIconKey = (typeof BADGE_CATEGORY_ICON_KEYS)[number];
export type CreateScoutLevelInput = z.infer<typeof createScoutLevelSchema>;
export type UpdateScoutLevelInput = z.infer<typeof updateScoutLevelSchema>;
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
