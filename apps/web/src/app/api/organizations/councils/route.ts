import type { NextRequest, NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function GET(): Promise<NextResponse> {
  return proxyApiRequest('/api/v1/organizations/councils');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: unknown = await request.json();
  return proxyApiRequest('/api/v1/organizations/councils', { method: 'POST', body });
}
