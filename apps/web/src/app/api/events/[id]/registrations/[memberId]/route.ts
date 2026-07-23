import type { NextRequest, NextResponse } from 'next/server';

import { proxyApiRequest } from '@/shared/utils/api-proxy';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
): Promise<NextResponse> {
  const { id, memberId } = await params;
  const body: unknown = await request.json();
  return proxyApiRequest(`/api/v1/events/${id}/registrations/${memberId}`, { method: 'PATCH', body });
}
