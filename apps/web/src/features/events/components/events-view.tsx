'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AddIcon, EventIcon, MembersIcon, SuccessIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  StatCardSkeleton,
  Tabs,
  useToast,
} from '@/shared/components/ui';

import { EVENT_STATUS_FILTER_OPTIONS, EVENT_VIEW_TABS } from '../constants';
import {
  createEvent,
  deleteEvent,
  EventsRequestError,
  getEvent,
  listAllEvents,
  listEventCategories,
  listEventOrganizers,
  listEvents,
  updateEvent,
} from '../services/events.service';
import type {
  Event,
  EventCategoryOption,
  EventFormValues,
  EventOrganizerOption,
  EventStatusFilter,
  EventSummary,
  EventViewMode,
} from '../types';
import { EventCalendar } from './event-calendar';
import { EventCard } from './event-card';
import { EventFormModal } from './event-form-modal';

const PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 300;

type ViewState = 'loading' | 'error' | 'ready';

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

export interface EventsViewProps {
  canManage: boolean;
}

export function EventsView({ canManage }: EventsViewProps) {
  const { showToast } = useToast();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<EventViewMode>('list');
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<EventSummary[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [categoryOptions, setCategoryOptions] = useState<EventCategoryOption[]>([]);
  const [organizerOptions, setOrganizerOptions] = useState<EventOrganizerOption[]>([]);

  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; event: Event } | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventSummary | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch, statusFilter, categoryFilter]);

  const fetchEvents = useCallback(async () => {
    setViewState('loading');
    try {
      const [pageResult, allMatching] = await Promise.all([
        listEvents({
          search: debouncedSearch || undefined,
          status: statusFilter,
          categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
          page,
          pageSize: PAGE_SIZE,
        }),
        listAllEvents({
          search: debouncedSearch || undefined,
          status: statusFilter,
          categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
        }),
      ]);
      setEvents(pageResult.events);
      setTotalItems(pageResult.totalItems);
      setCalendarEvents(allMatching);
      setViewState('ready');
      setHasLoadedOnce(true);
    } catch {
      setViewState('error');
    }
  }, [debouncedSearch, statusFilter, categoryFilter, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    listEventCategories().then(setCategoryOptions).catch(() => setCategoryOptions([]));
    listEventOrganizers().then(setOrganizerOptions).catch(() => setOrganizerOptions([]));
  }, []);

  async function handleCreate(values: EventFormValues) {
    const created = await createEvent(values);
    setFormModal(null);
    showToast(`"${created.title}" was created.`, 'success');
    fetchEvents();
  }

  async function handleUpdate(values: EventFormValues) {
    if (formModal?.mode !== 'edit') return;
    const updated = await updateEvent(formModal.event.id, values);
    setFormModal(null);
    showToast(`"${updated.title}" was updated.`, 'success');
    fetchEvents();
  }

  /** List/calendar rows only carry `EventSummary` — the edit form needs the description too. */
  async function openEditModal(event: EventSummary) {
    setLoadingEditId(event.id);
    try {
      const full = await getEvent(event.id);
      setFormModal({ mode: 'edit', event: full });
    } catch {
      showToast('Could not load this event for editing.', 'error');
    } finally {
      setLoadingEditId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsConfirming(true);
    try {
      await deleteEvent(deleteTarget.id);
      showToast(`"${deleteTarget.title}" was deleted.`, 'success');
      setDeleteTarget(null);
      fetchEvents();
    } catch (err) {
      showToast(err instanceof EventsRequestError ? err.message : 'Could not delete this event.', 'error');
    } finally {
      setIsConfirming(false);
    }
  }

  const upcomingCount = calendarEvents.filter((event) => event.status === 'upcoming').length;
  const completedCount = calendarEvents.filter((event) => event.status === 'completed').length;
  const totalRegistrations = calendarEvents.reduce((sum, event) => sum + event.registeredCount, 0);
  const hasActiveFilters = debouncedSearch.length > 0 || statusFilter !== 'all' || categoryFilter !== 'all';
  /**
   * Keeps `EventCalendar` mounted across a background refetch (e.g. after create/edit)
   * instead of unmounting it — the calendar owns its own month/selected-day state
   * internally, which a real unmount (gating on `viewState === 'ready'` alone) would
   * silently reset to the current month every time a mutation refetches the list.
   */
  const showContent = viewState === 'ready' || (viewState === 'loading' && hasLoadedOnce);

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-4 xs:grid-cols-2 lg2:grid-cols-3">
        {viewState === 'loading' ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard icon={EventIcon} value={upcomingCount} label="Upcoming Events" tone="blue" />
            <StatCard icon={SuccessIcon} value={completedCount} label="Completed" tone="green" />
            <StatCard icon={MembersIcon} value={totalRegistrations} label="Total Registrations" tone="gold" />
          </>
        )}
      </div>

      <Card>
        <CardHeader
          title="Events"
          subtitle="Manage upcoming and past troop and council activities"
          actions={
            canManage ? (
              <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
                New Event
              </Button>
            ) : undefined
          }
        />

        <div className="mb-4">
          <Tabs
            items={EVENT_VIEW_TABS}
            activeId={viewMode}
            onChange={(id) => setViewMode(id as EventViewMode)}
            ariaLabel="Event view"
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2.5">
          <SearchInput
            label="Search events"
            placeholder="Search title or location…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            className="w-full sm:w-64"
          />
          <Select
            aria-label="Filter by status"
            className="w-full sm:w-44"
            options={EVENT_STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as EventStatusFilter)}
          />
          {viewMode === 'list' ? (
            <Select
              aria-label="Filter by category"
              className="w-full sm:w-48"
              options={[{ value: 'all', label: 'All Categories' }, ...categoryOptions.map((c) => ({ value: c.id, label: c.name }))]}
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            />
          ) : null}
        </div>

        {viewState === 'loading' && !hasLoadedOnce ? (
          <div className="grid grid-cols-1 gap-4 lg2:grid-cols-2">
            <Card><CardSkeleton /></Card>
            <Card><CardSkeleton /></Card>
          </div>
        ) : null}

        {viewState === 'error' ? (
          <ErrorState onRetry={fetchEvents} description="We could not load events. Check your connection and try again." />
        ) : null}

        {showContent && viewMode === 'calendar' ? (
          <EventCalendar events={calendarEvents} onSelectEvent={(event) => router.push(`/events/${event.id}`)} />
        ) : null}

        {showContent && viewMode === 'list' && events.length === 0 && !hasActiveFilters ? (
          <EmptyState
            icon={EventIcon}
            title="No events yet"
            description={
              canManage
                ? 'Create the first event to start building the activity calendar.'
                : 'Check back once the Council schedules an event.'
            }
            action={
              canManage ? (
                <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
                  New Event
                </Button>
              ) : undefined
            }
          />
        ) : null}

        {showContent && viewMode === 'list' && events.length === 0 && hasActiveFilters ? (
          <EmptyState
            icon={EventIcon}
            title="No events match your filters"
            description="Try a different search term or clear the status/category filters."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : null}

        {showContent && viewMode === 'list' && events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 lg2:grid-cols-2">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  canManage={canManage}
                  isEditLoading={loadingEditId === event.id}
                  onEdit={() => openEditModal(event)}
                  onDelete={() => setDeleteTarget(event)}
                />
              ))}
            </div>

            <Pagination
              className="mt-4"
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={totalItems}
              onPageChange={setPage}
              itemLabel="events"
            />
          </>
        ) : null}
      </Card>

      <EventFormModal
        isOpen={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        initialValues={formModal?.mode === 'edit' ? toFormValues(formModal.event) : undefined}
        categoryOptions={categoryOptions}
        organizerOptions={organizerOptions}
        onClose={() => setFormModal(null)}
        onSubmit={formModal?.mode === 'edit' ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        tone="danger"
        title="Delete event?"
        isConfirming={isConfirming}
        description={
          <>
            <strong>{deleteTarget?.title}</strong> will be permanently deleted
            {deleteTarget && deleteTarget.registeredCount > 0
              ? `, along with its ${deleteTarget.registeredCount} registration${deleteTarget.registeredCount === 1 ? '' : 's'} and any attendance records`
              : ''}
            . This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
