import type {
  CategoryFormValues,
  CategoryItem,
  Council,
  CouncilFormValues,
  Troop,
  TroopFormValues,
  TroopLeaderOption,
} from '../types';

interface RawEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

export class OrganizationsRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'OrganizationsRequestError';
  }
}

/** Calls this app's own `/api/organizations/*` BFF routes, never the Express API directly (code-standards.md §7.4). */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new OrganizationsRequestError(json.error?.message ?? 'Something went wrong. Please try again.', json.error?.details);
  }

  return json.data;
}

function toCouncilRequestBody(values: CouncilFormValues) {
  return { name: values.name, description: values.description || undefined };
}

export async function listCouncils(): Promise<Council[]> {
  const data = await request<{ councils: Council[] }>('/api/organizations/councils');
  return data.councils;
}

export async function createCouncil(values: CouncilFormValues): Promise<Council> {
  const data = await request<{ council: Council }>('/api/organizations/councils', {
    method: 'POST',
    body: JSON.stringify(toCouncilRequestBody(values)),
  });
  return data.council;
}

export async function updateCouncil(id: string, values: CouncilFormValues): Promise<Council> {
  const data = await request<{ council: Council }>(`/api/organizations/councils/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toCouncilRequestBody(values)),
  });
  return data.council;
}

export async function deleteCouncil(id: string): Promise<void> {
  await request<{ deleted: true }>(`/api/organizations/councils/${id}`, { method: 'DELETE' });
}

function toTroopRequestBody(values: TroopFormValues) {
  return {
    troopCode: values.troopCode,
    name: values.name,
    councilId: values.councilId,
    leaderId: values.leaderId || undefined,
  };
}

export async function listTroops(): Promise<Troop[]> {
  const data = await request<{ troops: Troop[] }>('/api/organizations/troops');
  return data.troops;
}

export async function createTroop(values: TroopFormValues): Promise<Troop> {
  const data = await request<{ troop: Troop }>('/api/organizations/troops', {
    method: 'POST',
    body: JSON.stringify(toTroopRequestBody(values)),
  });
  return data.troop;
}

export async function updateTroop(id: string, values: TroopFormValues): Promise<Troop> {
  const data = await request<{ troop: Troop }>(`/api/organizations/troops/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toTroopRequestBody(values)),
  });
  return data.troop;
}

export async function deleteTroop(id: string): Promise<void> {
  await request<{ deleted: true }>(`/api/organizations/troops/${id}`, { method: 'DELETE' });
}

export async function listTroopLeaders(): Promise<TroopLeaderOption[]> {
  const data = await request<{ troopLeaders: TroopLeaderOption[] }>('/api/organizations/troop-leaders');
  return data.troopLeaders;
}

/**
 * The three lookup tables share a body shape apart from their one extra field —
 * `orderNumber` for scout levels, `icon` for badge categories. Sending either to the
 * wrong endpoint would fail Zod's strict parse, so each is opted into explicitly.
 */
function toCategoryRequestBody(
  values: CategoryFormValues,
  extras: { order?: boolean; icon?: boolean } = {},
) {
  return {
    name: values.name,
    description: values.description || undefined,
    ...(extras.order ? { orderNumber: values.orderNumber } : {}),
    ...(extras.icon ? { icon: values.icon } : {}),
  };
}

export async function listScoutLevels(): Promise<CategoryItem[]> {
  const data = await request<{ scoutLevels: CategoryItem[] }>('/api/organizations/scout-levels');
  return data.scoutLevels;
}

export async function createScoutLevel(values: CategoryFormValues): Promise<CategoryItem> {
  const data = await request<{ scoutLevel: CategoryItem }>('/api/organizations/scout-levels', {
    method: 'POST',
    body: JSON.stringify(toCategoryRequestBody(values, { order: true })),
  });
  return data.scoutLevel;
}

export async function updateScoutLevel(id: string, values: CategoryFormValues): Promise<CategoryItem> {
  const data = await request<{ scoutLevel: CategoryItem }>(`/api/organizations/scout-levels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toCategoryRequestBody(values, { order: true })),
  });
  return data.scoutLevel;
}

export async function deleteScoutLevel(id: string): Promise<void> {
  await request<{ deleted: true }>(`/api/organizations/scout-levels/${id}`, { method: 'DELETE' });
}

export async function listBadgeCategories(): Promise<CategoryItem[]> {
  const data = await request<{ badgeCategories: CategoryItem[] }>('/api/organizations/badge-categories');
  return data.badgeCategories;
}

export async function createBadgeCategory(values: CategoryFormValues): Promise<CategoryItem> {
  const data = await request<{ badgeCategory: CategoryItem }>('/api/organizations/badge-categories', {
    method: 'POST',
    body: JSON.stringify(toCategoryRequestBody(values, { icon: true })),
  });
  return data.badgeCategory;
}

export async function updateBadgeCategory(id: string, values: CategoryFormValues): Promise<CategoryItem> {
  const data = await request<{ badgeCategory: CategoryItem }>(`/api/organizations/badge-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toCategoryRequestBody(values, { icon: true })),
  });
  return data.badgeCategory;
}

export async function deleteBadgeCategory(id: string): Promise<void> {
  await request<{ deleted: true }>(`/api/organizations/badge-categories/${id}`, { method: 'DELETE' });
}

export async function listActivityCategories(): Promise<CategoryItem[]> {
  const data = await request<{ activityCategories: CategoryItem[] }>('/api/organizations/activity-categories');
  return data.activityCategories;
}

export async function createActivityCategory(values: CategoryFormValues): Promise<CategoryItem> {
  const data = await request<{ activityCategory: CategoryItem }>('/api/organizations/activity-categories', {
    method: 'POST',
    body: JSON.stringify(toCategoryRequestBody(values)),
  });
  return data.activityCategory;
}

export async function updateActivityCategory(id: string, values: CategoryFormValues): Promise<CategoryItem> {
  const data = await request<{ activityCategory: CategoryItem }>(`/api/organizations/activity-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toCategoryRequestBody(values)),
  });
  return data.activityCategory;
}

export async function deleteActivityCategory(id: string): Promise<void> {
  await request<{ deleted: true }>(`/api/organizations/activity-categories/${id}`, { method: 'DELETE' });
}
