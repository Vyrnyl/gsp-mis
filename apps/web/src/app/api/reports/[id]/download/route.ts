import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { API_ORIGIN } from '@/config/env';
import { ACCESS_TOKEN_COOKIE } from '@/features/auth/constants';

/**
 * Binary passthrough — `proxyApiRequest` assumes a JSON envelope, which doesn't fit a
 * file download. Forwards the same cookie-to-Bearer translation, then streams the
 * API's raw PDF/Excel bytes and headers straight through instead of re-wrapping them.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const response = await fetch(`${API_ORIGIN}/api/v1/reports/${id}/download`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    const json: unknown = await response.json();
    return NextResponse.json(json, { status: response.status });
  }

  const buffer = await response.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': response.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Disposition': response.headers.get('Content-Disposition') ?? 'attachment',
    },
  });
}
