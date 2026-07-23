import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  SignupRequest,
  SignupResponse,
} from '../types';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

export class AuthRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AuthRequestError';
  }
}

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as ApiEnvelope<TResponse>;

  if (!response.ok || !json.success || !json.data) {
    throw new AuthRequestError(json.error?.message ?? 'Something went wrong. Please try again.', json.error?.details);
  }

  return json.data;
}

/** Calls the BFF route (`/api/auth/login`), not the Express API — code-standards.md §7.4. */
export function login(payload: LoginRequest): Promise<LoginResponse> {
  return postJson<LoginResponse>('/api/auth/login', payload);
}

/** Same cookie-issuing pattern as `login` — a new account is signed in immediately. */
export function signup(payload: SignupRequest): Promise<SignupResponse> {
  return postJson<SignupResponse>('/api/auth/signup', payload);
}

/** Best-effort server-side revoke; the BFF clears cookies even if this throws. */
export function logout(): Promise<LogoutResponse> {
  return postJson<LogoutResponse>('/api/auth/logout', {});
}

export function forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  return postJson<ForgotPasswordResponse>('/api/auth/forgot-password', payload);
}
