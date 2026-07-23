import type { NextRequest, NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const body: unknown = await request.json();
  return proxyApiRequest(`/api/v1/members/${id}/reject`, { method: 'PATCH', body });
}
