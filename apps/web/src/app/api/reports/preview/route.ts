import type { NextRequest } from 'next/server';
import type { NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyApiRequest(`/api/v1/reports/preview${request.nextUrl.search}`);
}
