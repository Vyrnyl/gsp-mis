import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { API_ORIGIN } from '@/config/env';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/features/auth/constants';

/**
 * BFF route: best-effort revoke against the API, then always clears both cookies.
 * The browser never held a refresh token to send — this route reads it from its own
 * httpOnly cookie, same pattern as `refresh`.
 */
export async function POST(): Promise<NextResponse> {
  const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    await fetch(`${API_ORIGIN}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ success: true, data: { message: 'Signed out.' } });
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}
