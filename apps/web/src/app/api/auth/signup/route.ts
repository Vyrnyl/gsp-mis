import { NextResponse } from 'next/server';

import { API_ORIGIN } from '@/config/env';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/features/auth/constants';
import type { SignupRequest } from '@/features/auth/types';
import { getJwtExpirySeconds } from '@/shared/utils/jwt';

type ApiSignupData =
  | { status: 'active'; user: unknown; tokens: { accessToken: string; refreshToken: string } }
  | { status: 'pending'; message: string };

interface ApiEnvelope {
  success: boolean;
  data?: ApiSignupData;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

/**
 * BFF route: forwards to `POST /api/v1/auth/signup`. Executive Council/Troop Leader
 * signups come back `pending` (no `tokens` — the account needs Administrator approval
 * first), so only `active` (Admin, gated by its own secret key) gets cookies and an
 * immediate session, same as before.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as SignupRequest;

  const apiResponse = await fetch(`${API_ORIGIN}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await apiResponse.json()) as ApiEnvelope;

  if (!apiResponse.ok || !json.success || !json.data) {
    return NextResponse.json(json, { status: apiResponse.status });
  }

  if (json.data.status === 'pending') {
    return NextResponse.json({ success: true, data: json.data }, { status: 201 });
  }

  const { user, tokens } = json.data;
  const response = NextResponse.json({ success: true, data: { status: 'active', user } }, { status: 201 });
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
