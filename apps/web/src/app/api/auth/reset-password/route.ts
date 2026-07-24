import { NextResponse } from 'next/server';

import { API_ORIGIN } from '@/config/env';
import type { ResetPasswordRequest } from '@/features/auth/types';

/** BFF route: plain proxy — no session/tokens involved, same shape as forgot-password's route. */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as ResetPasswordRequest;

  const apiResponse = await fetch(`${API_ORIGIN}/api/v1/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await apiResponse.json()) as unknown;

  return NextResponse.json(json, { status: apiResponse.status });
}
