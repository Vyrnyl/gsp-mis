import type { NextRequest } from 'next/server';
import type { NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function GET(): Promise<NextResponse> {
  return proxyApiRequest('/api/v1/finance/fee-types');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: unknown = await request.json();
  return proxyApiRequest('/api/v1/finance/fee-types', { method: 'POST', body });
}
