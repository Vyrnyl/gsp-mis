import type { NextRequest, NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: unknown = await request.json();
  return proxyApiRequest('/api/v1/profile/change-password', { method: 'POST', body });
}
