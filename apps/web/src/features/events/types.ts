export type EventStatus = 'upcoming' | 'completed';
export type EventStatusFilter = 'all' | EventStatus;

export interface EventCategoryOption {
  id: string;
  name: string;
}

export interface EventOrganizerOption {
  id: string;
  fullName: string;
}

/** One row in the list/calendar views. Status is server-derived from `eventDate`, never stored. */
export interface EventSummary {
  id: string;
  title: string;
  eventDate: string; // ISO date, e.g. "2026-08-14"
  startTime: string | null; // "HH:mm"
  endTime: string | null; // "HH:mm"
  location: string | null;
  status: EventStatus;
  category: EventCategoryOption | null;
  organizer: EventOrganizerOption | null;
  /** Troop(s) led by the organizer, if any — derived, not a stored assignment (project-overview.md "assign troop leaders"). */
  troopNames: string[];
  registeredCount: number;
}

export type Event = EventSummary & {
  description: string | null;
};

export interface EventFormValues {
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  categoryId: string;
  organizerId: string;
}

export type EventViewMode = 'list' | 'calendar';
