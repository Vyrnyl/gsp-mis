import type { AttendanceSummary, Participant, RegistrationStatus } from '../types';

interface RawEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

interface ApiSuccess<T> {
  data: T;
}

export class AttendanceRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AttendanceRequestError';
  }
}

/** Calls this app's own `/api/events/*` and `/api/attendance` BFF routes, never the
 * Express API directly (code-standards.md §7.4). */
async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new AttendanceRequestError(
      json.error?.message ?? 'Something went wrong. Please try again.',
      json.error?.details,
    );
  }

  return { data: json.data };
}

export interface ParticipantsResult {
  participants: Participant[];
  summary: AttendanceSummary;
}

export async function listParticipants(eventId: string): Promise<ParticipantsResult> {
  const { data } = await request<ParticipantsResult>(`/api/events/${eventId}/registrations`);
  return data;
}

export async function registerParticipant(eventId: string, memberId: string): Promise<Participant> {
  const { data } = await request<{ participant: Participant }>(`/api/events/${eventId}/registrations`, {
    method: 'POST',
    body: JSON.stringify({ memberId }),
  });
  return data.participant;
}

export async function updateRegistrationStatus(
  eventId: string,
  memberId: string,
  status: RegistrationStatus,
): Promise<Participant> {
  const { data } = await request<{ participant: Participant }>(
    `/api/events/${eventId}/registrations/${memberId}`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
  );
  return data.participant;
}

export async function recordAttendance(
  eventId: string,
  memberId: string,
  status: 'present' | 'absent',
): Promise<void> {
  await request<{ record: unknown }>('/api/attendance', {
    method: 'POST',
    body: JSON.stringify({ eventId, memberId, status }),
  });
}
