import { cookies } from 'next/headers';

import { API_ORIGIN } from '@/config/env';
import { ACCESS_TOKEN_COOKIE } from '@/features/auth/constants';

import type { AuthUser } from '../types';

interface ApiEnvelope {
  success: boolean;
  data?: { user: AuthUser };
}

/**
 * Server-only — reads `next/headers` cookies, so this must never be imported from a
 * Client Component. Asks the real API who the presented access token belongs to
 * (server-to-server, same pattern as the `app/api/auth/*` route handlers) so the
 * `(app)` layout can hand the shell a real signed-in user instead of
 * `shared/mocks/session.mock.ts`. Returns null on any failure (missing cookie,
 * expired/invalid token, deactivated user) — the caller redirects to `/login`.
 */
export async function getSession(): Promise<AuthUser | null> {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;

  const response = await fetch(`${API_ORIGIN}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const json = (await response.json()) as ApiEnvelope;

  if (!response.ok || !json.success || !json.data) return null;
  return json.data.user;
}
