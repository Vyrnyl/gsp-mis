import type { RoleName } from '../../shared/constants/roles';
import type {
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
  ResetPasswordInput,
  SignupInput,
} from './auth.schema';

/** The one-role-per-user invariant means a single `RoleName`, never an array. */
export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: RoleName;
  avatarUrl: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type LoginRequestBody = LoginInput;
export type SignupRequestBody = SignupInput;
export type ForgotPasswordRequestBody = ForgotPasswordInput;
export type ResetPasswordRequestBody = ResetPasswordInput;
export type RefreshRequestBody = RefreshInput;
export type LogoutRequestBody = LogoutInput;

/**
 * What the service layer returns to the controller. The API itself stays stateless
 * and sets no cookies — the Next.js BFF is the one that reads `tokens` out of this
 * body and turns them into httpOnly cookies before anything reaches the browser.
 */
export interface LoginResponseBody {
  user: AuthUser;
  tokens: AuthTokens;
}

/**
 * Executive Council and Troop Leader self-signups self-assert an affiliation
 * (council/troop name) with nothing yet to verify it against, so they land
 * `pending` — no tokens, no session — until an Administrator activates the
 * account from Settings > Users & Access. Admin signup stays `active`; the
 * shared `ADMIN_SIGNUP_KEY` is its gate instead.
 */
export interface SignupActiveResponseBody {
  status: 'active';
  user: AuthUser;
  tokens: AuthTokens;
}

export interface SignupPendingResponseBody {
  status: 'pending';
  message: string;
}

export type SignupResponseBody = SignupActiveResponseBody | SignupPendingResponseBody;

export interface RefreshResponseBody {
  tokens: AuthTokens;
}

export interface ForgotPasswordResponseBody {
  /** Deliberately generic — must not reveal whether the email exists (user enumeration). */
  message: string;
}

export interface ResetPasswordResponseBody {
  message: string;
}

export interface LogoutResponseBody {
  message: string;
}

/** `GET /auth/me` — the shell's real session read (feature 1.2). */
export interface MeResponseBody {
  user: AuthUser;
}
