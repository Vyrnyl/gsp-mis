import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { API_ORIGIN } from '@/config/env';
import { ACCESS_TOKEN_COOKIE } from '@/features/auth/constants';

/**
 * Forwards a BFF route handler's request to the real Express API, translating the
 * caller's httpOnly `access_token` cookie into the `Authorization: Bearer` header
 * `requireAuth` expects — the API stays cookie-agnostic (project-overview.md
 * Authentication), so every authenticated feature's route handlers go through this
 * instead of duplicating the cookie-read/forward boilerplate `session.service.ts`
 * and the `app/api/auth/*` routes established for Feature 1.1.
 */
export async function proxyApiRequest(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<NextResponse> {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const response = await fetch(`${API_ORIGIN}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });

  const json: unknown = await response.json();
  return NextResponse.json(json, { status: response.status });
}
