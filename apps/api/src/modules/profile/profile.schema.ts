import { z } from 'zod';

/**
 * Request validation for the profile module (Feature 3.5, Loop step 3 — Contract).
 * Mirrored by hand in `apps/web/src/features/profile/types.ts` — same cross-workspace
 * convention as every other module's `*.schema.ts`.
 *
 * Contracted routes:
 *   GET  /api/v1/profile                 — no input
 *   PUT  /api/v1/profile                 — updateProfileSchema
 *   POST /api/v1/profile/change-password — changePasswordSchema
 */

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.'),
  email: z.string().trim().min(1, 'Email address is required.').email('Enter a valid email address.'),
  phoneNumber: z.string().trim().optional(),
});

/** `confirmPassword` is a frontend-only check (same as signup's `confirm`) — never sent to the API. */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
