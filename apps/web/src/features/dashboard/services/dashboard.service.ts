import type { AdminDashboardData, CouncilDashboardData, TroopDashboardData } from '../types';

interface RawEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export class DashboardRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DashboardRequestError';
  }
}

/** Discriminated by `role`, mirroring `DashboardResponseBody` in
 *  `apps/api/src/modules/dashboard/dashboard.types.ts`. */
export type DashboardResponse =
  | ({ role: 'admin' } & AdminDashboardData)
  | ({ role: 'executive_council' } & CouncilDashboardData)
  | ({ role: 'troop_leader' } & TroopDashboardData);

/** Calls this app's own `/api/dashboard` BFF route, never the Express API directly
 *  (code-standards.md §7.4). No parameters — the role is read server-side from the
 *  session (settled decision #4); a client can't ask for another role's data. */
export async function getDashboard(): Promise<DashboardResponse> {
  const response = await fetch('/api/dashboard', { cache: 'no-store' });
  const json = (await response.json()) as RawEnvelope<DashboardResponse>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new DashboardRequestError(json.error?.message ?? 'Something went wrong. Please try again.');
  }

  return json.data;
}
