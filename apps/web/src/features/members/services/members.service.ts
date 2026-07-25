import type {
  Member,
  MemberFormValues,
  MemberStatusFilter,
  MemberSummary,
  MemberTypeFilter,
  RenewMembershipValues,
  ScoutLevelOption,
  TroopOption,
} from '../types';

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface RawEnvelope<T> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

interface ApiSuccess<T> {
  data: T;
  meta?: PaginationMeta;
}

export class MembersRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'MembersRequestError';
  }
}

/** Calls this app's own `/api/members/*` and `/api/organizations/*` BFF routes, never the Express API directly (code-standards.md §7.4). */
async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new MembersRequestError(json.error?.message ?? 'Something went wrong. Please try again.', json.error?.details);
  }

  return { data: json.data, meta: json.meta };
}

export interface ListMembersParams {
  search?: string;
  status?: MemberStatusFilter;
  memberType?: MemberTypeFilter;
  troopId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListMembersResult {
  members: MemberSummary[];
  totalItems: number;
  totalPages: number;
}

function buildQuery(params: ListMembersParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.memberType && params.memberType !== 'all') query.set('memberType', params.memberType);
  if (params.troopId) query.set('troopId', params.troopId);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const search = query.toString();
  return search ? `?${search}` : '';
}

export async function listMembers(params: ListMembersParams): Promise<ListMembersResult> {
  const { data, meta } = await request<{ members: MemberSummary[] }>(`/api/members${buildQuery(params)}`);
  return {
    members: data.members,
    totalItems: meta?.totalItems ?? data.members.length,
    totalPages: meta?.totalPages ?? 1,
  };
}

export async function getMember(id: string): Promise<Member> {
  const { data } = await request<{ member: Member }>(`/api/members/${id}`);
  return data.member;
}

function toRequestBody(values: MemberFormValues) {
  return {
    memberType: values.memberType,
    firstName: values.firstName,
    middleName: values.middleName || undefined,
    lastName: values.lastName,
    birthDate: values.birthDate,
    gender: values.gender,
    email: values.email || undefined,
    phoneNumber: values.phoneNumber || undefined,
    address: values.address || undefined,
    troopId: values.troopId,
    scoutLevelId: values.memberType === 'scout' ? values.scoutLevelId : undefined,
    emergencyContactName: values.emergencyContactName || undefined,
    emergencyContactPhone: values.emergencyContactPhone || undefined,
    notes: values.notes || undefined,
  };
}

export async function createMember(values: MemberFormValues): Promise<Member> {
  const { data } = await request<{ member: Member }>('/api/members', {
    method: 'POST',
    body: JSON.stringify(toRequestBody(values)),
  });
  return data.member;
}

export async function updateMember(id: string, values: MemberFormValues): Promise<Member> {
  const { data } = await request<{ member: Member }>(`/api/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toRequestBody(values)),
  });
  return data.member;
}

export async function archiveMember(id: string): Promise<Member> {
  const { data } = await request<{ member: Member }>(`/api/members/${id}/archive`, { method: 'PATCH' });
  return data.member;
}

export async function restoreMember(id: string): Promise<Member> {
  const { data } = await request<{ member: Member }>(`/api/members/${id}/restore`, { method: 'PATCH' });
  return data.member;
}

export async function renewMembership(id: string, values: RenewMembershipValues): Promise<Member> {
  const { data } = await request<{ member: Member }>(`/api/members/${id}/renew`, {
    method: 'POST',
    body: JSON.stringify(values),
  });
  return data.member;
}

export interface ListPendingMembersParams {
  page?: number;
  pageSize?: number;
}

/** Queue for Feature 1.4 — same paginated `MemberSummary` shape as `listMembers`, status forced to `pending` server-side. */
export async function listPendingMembers(params: ListPendingMembersParams): Promise<ListMembersResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const search = query.toString();

  const { data, meta } = await request<{ members: MemberSummary[] }>(`/api/members/pending${search ? `?${search}` : ''}`);
  return {
    members: data.members,
    totalItems: meta?.totalItems ?? data.members.length,
    totalPages: meta?.totalPages ?? 1,
  };
}

export async function approveMember(id: string): Promise<Member> {
  const { data } = await request<{ member: Member }>(`/api/members/${id}/approve`, { method: 'PATCH' });
  return data.member;
}

export async function rejectMember(id: string, reason: string): Promise<Member> {
  const { data } = await request<{ member: Member }>(`/api/members/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
  return data.member;
}

export async function listTroops(): Promise<TroopOption[]> {
  const { data } = await request<{ troops: TroopOption[] }>('/api/organizations/troops');
  return data.troops;
}

export async function listScoutLevels(): Promise<ScoutLevelOption[]> {
  const { data } = await request<{ scoutLevels: ScoutLevelOption[] }>('/api/organizations/scout-levels');
  return data.scoutLevels;
}
