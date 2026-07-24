import type { NextRequest, NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function GET(): Promise<NextResponse> {
  return proxyApiRequest('/api/v1/profile');
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const body: unknown = await request.json();
  return proxyApiRequest('/api/v1/profile', { method: 'PUT', body });
}
