import { z } from 'zod';

/**
 * Request validation for the auth module (Feature 1.1, Loop step 3 — Contract).
 *
 * Routes are not wired yet (that is Loop step 4); these schemas are the source of
 * truth for both the eventual `auth.validator.ts` and `auth.types.ts` inference below.
 * Mirrored by hand in `apps/web/src/features/auth/types.ts` — the workspaces do not
 * share a types package, and the API uses relative imports so it cannot reach across
 * to `apps/web` even if they did.
 *
 * Contracted routes (mounted under `/api/v1/auth`):
 *   POST /login            — loginSchema
 *   POST /signup           — signupSchema
 *   POST /refresh          — refreshSchema (BFF forwards its httpOnly refresh cookie)
 *   POST /logout           — logoutSchema
 *   POST /forgot-password  — forgotPasswordSchema
 */

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email address is required.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const signupBaseSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  email: z.string().trim().min(1, 'Email address is required.').email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

/**
 * Discriminated by `role` because each of the three roles collects different
 * account-specific fields on signup (signup-form.tsx renders them conditionally).
 */
export const signupSchema = z.discriminatedUnion('role', [
  signupBaseSchema.extend({
    role: z.literal('troop_leader'),
    troopNumber: z.string().trim().min(1, 'Troop number is required.'),
    primaryScoutLevel: z.string().trim().min(1, 'Primary scout level is required.'),
    homeCouncilName: z.string().trim().min(1, 'Home council is required.'),
  }),
  signupBaseSchema.extend({
    role: z.literal('executive_council'),
    councilName: z.string().trim().min(1, 'Council name is required.'),
    region: z.string().trim().min(1, 'Region is required.'),
    councilCode: z.string().trim().min(1, 'Council code is required.'),
  }),
  signupBaseSchema.extend({
    role: z.literal('admin'),
    employeeId: z.string().trim().min(1, 'Employee ID is required.'),
    adminSecretKey: z.string().min(1, 'Admin secret key is required.'),
  }),
]);

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Email address is required.').email('Enter a valid email address.'),
});

/** The BFF sends the refresh token it holds in its own httpOnly cookie; the API never sets cookies. */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required.'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
