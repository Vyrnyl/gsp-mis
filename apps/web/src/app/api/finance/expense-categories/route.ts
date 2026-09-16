import type { NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

/** Controlled expense categories for the record-expense picker (2026-09-16). */
export async function GET(): Promise<NextResponse> {
  return proxyApiRequest('/api/v1/finance/expense-categories');
}
