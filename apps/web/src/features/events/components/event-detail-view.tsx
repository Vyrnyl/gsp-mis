'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  AttendanceIcon,
  ChevronLeftIcon,
  DeleteIcon,
  EditIcon,
  EventIcon,
  LocationIcon,
  MembersIcon,
  type IconType,
} from '@/shared/components/icons';
import { Button, Card, CardHeader, CardSkeleton, ConfirmDialog, ErrorState, useToast } from '@/shared/components/ui';

import {
  deleteEvent,
  EventsRequestError,
  getEvent,
  listEventCategories,
  listEventOrganizers,
  updateEvent,
} from '../services/events.service';
import type { Event, EventCategoryOption, EventFormValues, EventOrganizerOption } from '../types';
import { formatEventDate, formatEventTimeRange } from '../utils';
import { EventFormModal } from './event-form-modal';
import { EventStatusBadge } from './event-status-badge';

type ViewState = 'loading' | 'error' | 'not-found' | 'ready';

function toFormValues(event: Event): EventFormValues {
  return {
    title: event.title,
    description: event.description ?? '',
    eventDate: event.eventDate,
    startTime: event.startTime ?? '',
    endTime: event.endTime ?? '',
    location: event.location ?? '',
    categoryId: event.category?.id ?? '',
    organizerId: event.organizer?.id ?? '',
  };
}

export interface EventDetailViewProps {
  eventId: string;
  canManage: boolean;
}

export function EventDetailView({ eventId, canManage }: EventDetailViewProps) {
  const { showToast } = useToast();
  const router = useRouter();

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [event, setEvent] = useState<Event | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<EventCategoryOption[]>([]);
  const [organizerOptions, setOrganizerOptions] = useState<EventOrganizerOption[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [didDelete, setDidDelete] = useState(false);

  const fetchEvent = useCallback(async () => {
    setViewState('loading');
    try {
      const found = await getEvent(eventId);
      setEvent(found);
      setViewState('ready');
    } catch (err) {
      if (err instanceof EventsRequestError && err.message.toLowerCase().includes('not found')) {
        setViewState('not-found');
      } else {
        setViewState('error');
      }
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    listEventCategories().then(setCategoryOptions).catch(() => setCategoryOptions([]));
    listEventOrganizers().then(setOrganizerOptions).catch(() => setOrganizerOptions([]));
  }, []);

  async function handleEditSubmit(values: EventFormValues) {
    await updateEvent(eventId, values);
    setIsEditOpen(false);
    showToast('Event updated.', 'success');
    fetchEvent();
  }

  async function confirmDelete() {
    setIsConfirming(true);
    try {
      await deleteEvent(eventId);
      showToast('Event deleted.', 'success');
      setDidDelete(true);
    } catch (err) {
      showToast(err instanceof EventsRequestError ? err.message : 'Could not delete this event.', 'error');
      setIsConfirming(false);
    }
  }

  const backLink = (
    <Link
      href="/events"
      className="mb-4 inline-flex items-center gap-1 text-[0.85rem] font-semibold text-brand-green hover:underline"
    >
      <ChevronLeftIcon aria-hidden /> Back to Events
    </Link>
  );

  if (viewState === 'loading') {
    return (
      <div>
        {backLink}
        <Card>
          <CardSkeleton lines={5} />
        </Card>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div>
        {backLink}
        <ErrorState onRetry={fetchEvent} description="We could not load this event." />
      </div>
    );
  }

  if (viewState === 'not-found' || !event || didDelete) {
    return (
      <div>
        {backLink}
        <ErrorState
          title={didDelete ? 'Event deleted' : 'Event not found'}
          description={
            didDelete
              ? 'This event has been removed.'
              : 'This event may have been removed, or the link is incorrect.'
          }
          onRetry={didDelete ? undefined : fetchEvent}
        />
      </div>
    );
  }

  const timeRange = formatEventTimeRange(event.startTime, event.endTime);

  return (
    <div>
      {backLink}

      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-xl bg-brand-green3 text-2xl text-brand-green">
              <EventIcon aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">{event.title}</h2>
              <p className="mt-0.5 text-[0.85rem] text-muted">
                {formatEventDate(event.eventDate, 'long')}
                {timeRange ? ` · ${timeRange}` : ''}
              </p>
              <div className="mt-2">
                <EventStatusBadge status={event.status} />
              </div>
            </div>
          </div>

          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="gray" leadingIcon={<EditIcon aria-hidden />} onClick={() => setIsEditOpen(true)}>
                Edit
              </Button>
              <Button variant="red" leadingIcon={<DeleteIcon aria-hidden />} onClick={() => setIsDeleteOpen(true)}>
                Delete
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg2:grid-cols-3">
        <Card className="lg2:col-span-2">
          <CardHeader title="Event Details" as="h3" />
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <ProfileField label="Location" value={event.location ?? '—'} icon={LocationIcon} />
            <ProfileField label="Category" value={event.category?.name ?? '—'} />
            <ProfileField
              label="Organizer"
              value={event.organizer?.fullName ?? 'Unassigned'}
            />
            <ProfileField
              label="Troop(s)"
              value={event.troopNames.length > 0 ? event.troopNames.join(', ') : '—'}
            />
            <div className="sm:col-span-2">
              <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.03em] text-ink-subtle">
                Description
              </dt>
              <dd className="mt-1 text-[0.92rem] leading-relaxed text-ink">
                {event.description ?? 'No description provided.'}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Registrations" as="h3" />
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-status-info-bg text-brand-blue">
              <MembersIcon aria-hidden />
            </span>
            <div>
              <p className="text-[1.4rem] font-bold leading-none text-ink">{event.registeredCount}</p>
              <p className="mt-1 text-[0.8rem] text-muted">members registered</p>
            </div>
          </div>
          {!event.organizer ? (
            <p className="mt-4 rounded-field bg-status-warning-bg px-3.5 py-2.5 text-[0.85rem] text-status-warning-fg">
              No organizer assigned yet.
            </p>
          ) : null}
          <Button
            variant="outline"
            className="mt-4 w-full"
            leadingIcon={<AttendanceIcon aria-hidden />}
            onClick={() => router.push(`/attendance?eventId=${event.id}`)}
          >
            Manage Attendance
          </Button>
        </Card>
      </div>

      <EventFormModal
        isOpen={isEditOpen}
        mode="edit"
        initialValues={toFormValues(event)}
        categoryOptions={categoryOptions}
        organizerOptions={organizerOptions}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        tone="danger"
        title="Delete event?"
        isConfirming={isConfirming}
        description={
          <>
            <strong>{event.title}</strong> will be permanently deleted
            {event.registeredCount > 0
              ? `, along with its ${event.registeredCount} registration${event.registeredCount === 1 ? '' : 's'} and any attendance records`
              : ''}
            . This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}

function ProfileField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: IconType;
}) {
  return (
    <div>
      <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.03em] text-ink-subtle">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 text-[0.92rem] text-ink">
        {Icon ? <Icon className="text-muted" aria-hidden /> : null}
        {value}
      </dd>
    </div>
  );
}
