import type {
  AchievementFormValues,
  AchievementRecordSummary,
  BadgeCatalogItem,
  BadgeFormValues,
  MemberOption,
  MemberProgressSummary,
  RecordBadgeFormValues,
} from '../types';

interface RawEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

export class BadgesRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'BadgesRequestError';
  }
}

/** Calls this app's own `/api/badges|member-badges|achievements` BFF routes, never the Express API directly (code-standards.md §7.4). */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new BadgesRequestError(json.error?.message ?? 'Something went wrong. Please try again.', json.error?.details);
  }

  return json.data;
}

// Badge catalog
export async function listBadges(): Promise<BadgeCatalogItem[]> {
  const { badges } = await request<{ badges: BadgeCatalogItem[] }>('/api/badges');
  return badges;
}

export async function createBadge(values: BadgeFormValues): Promise<BadgeCatalogItem> {
  const { badge } = await request<{ badge: BadgeCatalogItem }>('/api/badges', {
    method: 'POST',
    body: JSON.stringify(values),
  });
  return badge;
}

export async function updateBadge(badgeId: string, values: BadgeFormValues): Promise<BadgeCatalogItem> {
  const { badge } = await request<{ badge: BadgeCatalogItem }>(`/api/badges/${badgeId}`, {
    method: 'PUT',
    body: JSON.stringify(values),
  });
  return badge;
}

export async function deleteBadge(badgeId: string): Promise<void> {
  await request<{ deleted: true }>(`/api/badges/${badgeId}`, { method: 'DELETE' });
}

export async function listMemberOptions(): Promise<MemberOption[]> {
  const { members } = await request<{ members: MemberOption[] }>('/api/badges/member-options');
  return members;
}

// Member progress
export async function listMemberProgress(): Promise<MemberProgressSummary[]> {
  const { members } = await request<{ members: MemberProgressSummary[] }>('/api/member-badges');
  return members;
}

export async function recordMemberBadge(values: RecordBadgeFormValues): Promise<void> {
  await request('/api/member-badges', { method: 'POST', body: JSON.stringify(values) });
}

export async function verifyMemberBadge(memberBadgeId: string): Promise<void> {
  await request(`/api/member-badges/${memberBadgeId}/verify`, { method: 'PATCH' });
}

// Achievements
export async function listAchievements(): Promise<AchievementRecordSummary[]> {
  const { achievements } = await request<{ achievements: AchievementRecordSummary[] }>('/api/achievements');
  return achievements;
}

export async function createAchievement(values: AchievementFormValues): Promise<AchievementRecordSummary> {
  const { achievement } = await request<{ achievement: AchievementRecordSummary }>('/api/achievements', {
    method: 'POST',
    body: JSON.stringify(values),
  });
  return achievement;
}
