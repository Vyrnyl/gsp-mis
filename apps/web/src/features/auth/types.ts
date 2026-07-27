/**
 * Matches the seeded role ids in `apps/api/src/shared/constants/roles.ts`
 * (`admin`, `executive_council`, `troop_leader`). Not imported directly — the API
 * uses relative imports and the workspaces don't share a types package, so this is
 * kept in sync by hand with `apps/api/src/modules/auth/{auth.types,auth.schema}.ts`.
 */
export type AuthRoleId = 'admin' | 'executive_council' | 'troop_leader';

export interface DemoAccount {
  roleId: AuthRoleId;
  name: string;
  email: string;
  password: string;
}

/** Mirrors `AuthUser` in `auth.types.ts` — the shape the BFF exposes to the browser. */
export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: AuthRoleId;
  avatarUrl: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequestBase {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Discriminated by `role`, mirroring `signupSchema` in `auth.schema.ts` — each role
 * collects different account-specific fields, matching signup-form.tsx's conditional
 * fields for troop leader / executive council.
 *
 * No `admin` variant: self-signup for the Administrator role was removed 2026-07-27
 * and the API's `signupSchema` rejects it with a 400. Note this is narrower than
 * `AuthRoleId` above, which deliberately keeps `admin` — Administrators still log in
 * and still hold sessions; they are simply created by the seed or by another
 * Administrator via Settings > Users & Access rather than by signing themselves up.
 */
export type SignupRequest =
  | (SignupRequestBase & {
      role: 'troop_leader';
      troopNumber: string;
      primaryScoutLevel: string;
      homeCouncilName: string;
    })
  | (SignupRequestBase & {
      role: 'executive_council';
      councilName: string;
      region: string;
      councilCode: string;
    });

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * What the browser receives from the BFF's own `/api/auth/*` route handlers — never
 * `tokens`. The BFF reads `LoginResponseBody`/`SignupResponseBody` (auth.types.ts)
 * from the API, sets httpOnly cookies from `tokens`, and forwards only `user` on.
 */
export interface LoginResponse {
  user: AuthUser;
}

/**
 * Mirrors `SignupResponseBody` in `auth.types.ts`. Every signup now lands `pending`
 * (no session yet, needs Administrator approval) — Executive Council and Troop Leader
 * are the only self-signup roles left since Administrator self-signup was removed
 * 2026-07-27, so `SignupActiveResponse` is currently unreachable. It is kept, rather
 * than deleted, so the BFF's cookie-setting branch still compiles and restoring admin
 * self-signup stays a schema-only change.
 */
export interface SignupActiveResponse {
  status: 'active';
  user: AuthUser;
}

export interface SignupPendingResponse {
  status: 'pending';
  message: string;
}

export type SignupResponse = SignupActiveResponse | SignupPendingResponse;

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}
