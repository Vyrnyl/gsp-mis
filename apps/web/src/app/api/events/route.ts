import type { NextRequest } from 'next/server';
import type { NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyApiRequest(`/api/v1/events${request.nextUrl.search}`);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: unknown = await request.json();
  return proxyApiRequest('/api/v1/events', { method: 'POST', body });
}
