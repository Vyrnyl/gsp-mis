import type { NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function PATCH(): Promise<NextResponse> {
  return proxyApiRequest('/api/v1/notifications/read-all', { method: 'PATCH' });
}
