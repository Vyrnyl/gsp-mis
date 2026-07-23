import { NextResponse } from 'next/server';

import { API_ORIGIN } from '@/config/env';
import type { ForgotPasswordRequest } from '@/features/auth/types';

/** BFF route: plain proxy — no tokens involved, nothing to translate into cookies. */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as ForgotPasswordRequest;

  const apiResponse = await fetch(`${API_ORIGIN}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await apiResponse.json()) as unknown;

  return NextResponse.json(json, { status: apiResponse.status });
}
