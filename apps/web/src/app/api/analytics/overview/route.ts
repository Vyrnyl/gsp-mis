import type { NextRequest, NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

/** Forwards the caller's own query string (`range`, `troopId`) rather than rebuilding
 * it — the Express API's `overviewQuerySchema` is the single validator, so an unknown
 * or malformed param is rejected there with the standard envelope instead of being
 * silently dropped here. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const search = request.nextUrl.search;
  return proxyApiRequest(`/api/v1/analytics/overview${search}`);
}
