import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { API_ORIGIN } from '@/config/env';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/features/auth/constants';
import { getJwtExpirySeconds } from '@/shared/utils/jwt';

interface ApiEnvelope {
  success: boolean;
  data?: { tokens: { accessToken: string; refreshToken: string } };
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

/** BFF route: reads the refresh cookie itself — the browser never sends a body. */
export async function POST(): Promise<NextResponse> {
  const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No session to refresh.' } },
      { status: 401 },
    );
  }

  const apiResponse = await fetch(`${API_ORIGIN}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const json = (await apiResponse.json()) as ApiEnvelope;

  if (!apiResponse.ok || !json.success || !json.data) {
    const response = NextResponse.json(json, { status: apiResponse.status });
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const { tokens } = json.data;
  const response = NextResponse.json({ success: true, data: {} });
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: getJwtExpirySeconds(tokens.accessToken),
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: getJwtExpirySeconds(tokens.refreshToken),
  });

  return response;
}
