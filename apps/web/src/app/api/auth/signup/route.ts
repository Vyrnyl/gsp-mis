import { NextResponse } from 'next/server';

import { API_ORIGIN } from '@/config/env';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/features/auth/constants';
import type { SignupRequest } from '@/features/auth/types';
import { getJwtExpirySeconds } from '@/shared/utils/jwt';

interface ApiEnvelope {
  success: boolean;
  data?: { user: unknown; tokens: { accessToken: string; refreshToken: string } };
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

/**
 * BFF route: forwards to `POST /api/v1/auth/signup`, then — same as login — strips the
 * returned tokens into httpOnly cookies so the new account is signed in immediately.
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

  const { user, tokens } = json.data;
  const response = NextResponse.json({ success: true, data: { user } }, { status: 201 });
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
