import type { NextRequest, NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyApiRequest(`/api/v1/audit-logs${request.nextUrl.search}`);
}
