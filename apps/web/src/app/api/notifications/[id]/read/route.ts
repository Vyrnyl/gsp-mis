import type { NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  return proxyApiRequest(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
}
