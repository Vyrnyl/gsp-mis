import { z } from 'zod';

/**
 * Request validation for the settings module (Feature 3.4, Loop step 3 — Contract).
 * Mirrored by hand in `apps/web/src/features/settings/types.ts` — same cross-workspace
 * convention as every other module's `*.schema.ts`.
 *
 * Contracted routes:
 *   GET    /api/v1/settings                — no input
 *   PUT    /api/v1/settings                — updateSystemSettingsSchema
 *   GET    /api/v1/settings/backup         — no input
 *   POST   /api/v1/settings/backup         — no input
 *   GET    /api/v1/users                   — listUsersQuerySchema
 *   POST   /api/v1/users                   — createUserSchema
 *   PATCH  /api/v1/users/:id               — updateUserSchema
 *   PATCH  /api/v1/users/:id/status        — setUserStatusSchema
 *   POST   /api/v1/users/:id/reset-password — no input
 *   DELETE /api/v1/users/:id               — no input
 *   GET    /api/v1/audit-logs              — listAuditLogsQuerySchema
 */

export const roleNameSchema = z.enum(['admin', 'executive_council', 'troop_leader']);

/** Directly mirrors `SystemSettingsFormValues` — the API owns the string-keyed row mapping. */
export const updateSystemSettingsSchema = z.object({
  organizationName: z.string().trim().min(1, 'Organization name is required.'),
  membershipTermMonths: z.coerce.number().int().min(1, 'Membership term must be at least 1 month.'),
  renewalWindowDays: z.coerce.number().int().min(0, 'Renewal window cannot be negative.'),
  emailNotificationsEnabled: z.boolean(),
});

const userBaseSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.'),
  email: z.string().trim().min(1, 'Email address is required.').email('Enter a valid email address.'),
  phoneNumber: z.string().trim().optional(),
  role: roleNameSchema,
});

export const createUserSchema = userBaseSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

/** Edit is a full-record replace, including role reassignment — same shape minus password. */
export const updateUserSchema = userBaseSchema;

export const setUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const listUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: roleNameSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const listAuditLogsQuerySchema = z.object({
  search: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type UpdateSystemSettingsInput = z.infer<typeof updateSystemSettingsSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetUserStatusInput = z.infer<typeof setUserStatusSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
