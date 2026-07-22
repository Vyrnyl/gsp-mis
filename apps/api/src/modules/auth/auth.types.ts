import type { RoleName } from '../../shared/constants/roles';
import type {
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
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

export type SignupResponseBody = LoginResponseBody;

export interface RefreshResponseBody {
  tokens: AuthTokens;
}

export interface ForgotPasswordResponseBody {
  /** Deliberately generic — must not reveal whether the email exists (user enumeration). */
  message: string;
}

export interface LogoutResponseBody {
  message: string;
}
