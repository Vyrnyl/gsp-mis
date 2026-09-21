import type { NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

/** Administrator-only; the API enforces the role, this only forwards the call. */
export async function DELETE(): Promise<NextResponse> {
  return proxyApiRequest('/api/v1/reports/reset', { method: 'DELETE' });
}
