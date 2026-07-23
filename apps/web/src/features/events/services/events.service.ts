import { listActivityCategories, listTroopLeaders } from '@/features/organizations/services/organizations.service';

import type {
  Event,
  EventCategoryOption,
  EventFormValues,
  EventOrganizerOption,
  EventStatusFilter,
  EventSummary,
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

export class EventsRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'EventsRequestError';
  }
}

/** Calls this app's own `/api/events/*` BFF routes, never the Express API directly (code-standards.md §7.4). */
async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new EventsRequestError(json.error?.message ?? 'Something went wrong. Please try again.', json.error?.details);
  }

  return { data: json.data, meta: json.meta };
}

export interface ListEventsParams {
  search?: string;
  status?: EventStatusFilter;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListEventsResult {
  events: EventSummary[];
  totalItems: number;
}

function buildQuery(params: ListEventsParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const search = query.toString();
  return search ? `?${search}` : '';
}

export async function listEvents(params: ListEventsParams = {}): Promise<ListEventsResult> {
  const { data, meta } = await request<{ events: EventSummary[] }>(`/api/events${buildQuery(params)}`);
  return { events: data.events, totalItems: meta?.totalItems ?? data.events.length };
}

/** For the calendar view, which needs every matching event in view at once, not one page. */
export async function listAllEvents(
  params: Omit<ListEventsParams, 'page' | 'pageSize'> = {},
): Promise<EventSummary[]> {
  const { events } = await listEvents({ ...params, page: 1, pageSize: 200 });
  return events;
}

export async function getEvent(id: string): Promise<Event> {
  const { data } = await request<{ event: Event }>(`/api/events/${id}`);
  return data.event;
}

function toRequestBody(values: EventFormValues) {
  return {
    title: values.title,
    description: values.description || undefined,
    eventDate: values.eventDate,
    startTime: values.startTime || undefined,
    endTime: values.endTime || undefined,
    location: values.location || undefined,
    categoryId: values.categoryId,
    organizerId: values.organizerId || undefined,
  };
}

export async function createEvent(values: EventFormValues): Promise<Event> {
  const { data } = await request<{ event: Event }>('/api/events', {
    method: 'POST',
    body: JSON.stringify(toRequestBody(values)),
  });
  return data.event;
}

export async function updateEvent(id: string, values: EventFormValues): Promise<Event> {
  const { data } = await request<{ event: Event }>(`/api/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toRequestBody(values)),
  });
  return data.event;
}

export async function deleteEvent(id: string): Promise<void> {
  await request<{ deleted: true }>(`/api/events/${id}`, { method: 'DELETE' });
}

/** Reuses 1.6's activity-categories lookup rather than duplicating it in the events module. */
export async function listEventCategories(): Promise<EventCategoryOption[]> {
  const categories = await listActivityCategories();
  return categories.map((category) => ({ id: category.id, name: category.name }));
}

/** Reuses 1.6's troop-leader lookup — an event's "organizer" is always a troop-leader user. */
export async function listEventOrganizers(): Promise<EventOrganizerOption[]> {
  const leaders = await listTroopLeaders();
  return leaders.map((leader) => ({ id: leader.id, fullName: leader.fullName }));
}
