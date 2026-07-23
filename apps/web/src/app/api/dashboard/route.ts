import type { NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function GET(): Promise<NextResponse> {
  return proxyApiRequest('/api/v1/dashboard');
}
