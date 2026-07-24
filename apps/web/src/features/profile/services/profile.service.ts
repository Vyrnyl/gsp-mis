import type { ChangePasswordFormValues, ProfileFormValues, ProfileSummary } from '../types';

interface RawEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

export class ProfileRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ProfileRequestError';
  }
}

/** Calls this app's own `/api/profile` BFF routes, never the Express API directly (code-standards.md §7.4). */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new ProfileRequestError(json.error?.message ?? 'Something went wrong. Please try again.', json.error?.details);
  }

  return json.data;
}

export function getProfile(): Promise<ProfileSummary> {
  return request<ProfileSummary>('/api/profile');
}

export function updateProfile(values: ProfileFormValues): Promise<ProfileSummary> {
  return request<ProfileSummary>('/api/profile', { method: 'PUT', body: JSON.stringify(values) });
}

export async function changePassword(values: ChangePasswordFormValues): Promise<void> {
  await request<{ changed: true }>('/api/profile/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
  });
}
