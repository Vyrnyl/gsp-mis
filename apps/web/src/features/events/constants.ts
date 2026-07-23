import type { BadgeTone } from '@/shared/components/ui';

import type { EventFormValues, EventStatus, EventViewMode } from './types';

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  upcoming: 'Upcoming',
  completed: 'Completed',
};

export const EVENT_STATUS_TONES: Record<EventStatus, BadgeTone> = {
  upcoming: 'blue',
  completed: 'green',
};

export const EVENT_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

export const EVENT_VIEW_TABS: Array<{ id: EventViewMode; label: string }> = [
  { id: 'list', label: 'List' },
  { id: 'calendar', label: 'Calendar' },
];

export const EMPTY_EVENT_FORM_VALUES: EventFormValues = {
  title: '',
  description: '',
  eventDate: '',
  startTime: '',
  endTime: '',
  location: '',
  categoryId: '',
  organizerId: '',
};
