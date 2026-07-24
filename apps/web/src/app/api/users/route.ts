import type { NextRequest, NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyApiRequest(`/api/v1/users${request.nextUrl.search}`);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: unknown = await request.json();
  return proxyApiRequest('/api/v1/users', { method: 'POST', body });
}
