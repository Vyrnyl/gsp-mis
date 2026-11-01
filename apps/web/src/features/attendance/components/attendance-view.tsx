'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { EventIcon, EyeIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  Combobox,
  EmptyState,
  ErrorState,
  TableSkeleton,
  useToast,
} from '@/shared/components/ui';

import { listAllEvents } from '@/features/events/services/events.service';
import type { EventSummary } from '@/features/events/types';
import { formatEventDate } from '@/features/events/utils';

import { AttendanceSummaryCards } from './attendance-summary-cards';
import { ParticipantAttendanceTable } from './participant-attendance-table';
import {
  AttendanceRequestError,
  listParticipants,
  recordAttendance,
} from '../services/attendance.service';
import type { AttendanceSummary, Participant } from '../types';

type ViewState = 'loading' | 'error' | 'ready';

export interface AttendanceViewProps {
  /** Gates recording attendance — `attendance:write` (Admin + Troop Leader; Executive
   * Council reads only, per project-overview.md's monitoring-only Activity Monitoring
   * section). Registering participants lives on the event's own page. */
  canManage: boolean;
  initialEventId?: string;
}

export function AttendanceView({ canManage, initialEventId }: AttendanceViewProps) {
  const { showToast } = useToast();
  const router = useRouter();

  const [eventsState, setEventsState] = useState<ViewState>('loading');
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId ?? '');

  const [participantsState, setParticipantsState] = useState<ViewState>('loading');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalExpected: 0,
    totalPresent: 0,
    totalAbsent: 0,
    attendanceRate: 0,
  });

  const [pendingRegistrationId, setPendingRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEventsState('loading');
    listAllEvents()
      .then((result) => {
        if (cancelled) return;
        setEvents(result);
        setEventsState('ready');
        setSelectedEventId((current) => current || result[0]?.id || '');
      })
      .catch(() => {
        if (!cancelled) setEventsState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchParticipants = useCallback(async () => {
    if (!selectedEventId) return;
    setParticipantsState('loading');
    try {
      const result = await listParticipants(selectedEventId);
      setParticipants(result.participants.filter((p) => p.registrationStatus !== 'cancelled'));
      setSummary(result.summary);
      setParticipantsState('ready');
    } catch {
      setParticipantsState('error');
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;

  async function handleToggleAttendance(participant: Participant, next: 'present' | 'absent') {
    if (!selectedEventId) return;
    setPendingRegistrationId(participant.registrationId);
    try {
      await recordAttendance(selectedEventId, participant.memberId, next);
      await fetchParticipants();
    } catch (err) {
      showToast(
        err instanceof AttendanceRequestError ? err.message : 'Could not record attendance.',
        'error',
      );
    } finally {
      setPendingRegistrationId(null);
    }
  }

  const viewEventButton = selectedEvent ? (
    <Button
      variant="outline"
      leadingIcon={<EyeIcon aria-hidden />}
      onClick={() => router.push(`/events/${selectedEvent.id}`)}
    >
      View Event
    </Button>
  ) : undefined;

  return (
    <div>
      <Card className="mb-6">
        <div className="w-full sm:w-72">
          <label
            htmlFor="attendance-event-picker"
            className="mb-1.5 block text-[0.85rem] font-semibold text-ink"
          >
            Event
          </label>
          {eventsState === 'ready' && events.length === 0 ? (
            <p className="text-[0.88rem] text-muted">No events yet.</p>
          ) : (
            /* Combobox — the event list only grows, and this picker is the page's
               primary control, so scrolling past a year of events to reach today's
               is the common case rather than the edge one. */
            <Combobox
              id="attendance-event-picker"
              disabled={eventsState !== 'ready'}
              options={events.map((event) => ({ value: event.id, label: event.title }))}
              value={selectedEventId}
              onChange={setSelectedEventId}
              placeholder="Select an event"
              searchPlaceholder="Search events…"
              emptyMessage="No events match that search."
            />
          )}
        </div>
      </Card>

      {eventsState === 'error' ? (
        <ErrorState
          description="We could not load the events list."
          onRetry={() => {
            setEventsState('loading');
            listAllEvents()
              .then((result) => {
                setEvents(result);
                setEventsState('ready');
                setSelectedEventId((current) => current || result[0]?.id || '');
              })
              .catch(() => setEventsState('error'));
          }}
        />
      ) : eventsState === 'ready' && events.length === 0 ? (
        <EmptyState
          icon={EventIcon}
          title="No events yet"
          description="Create an event first, then come back here to manage its attendance."
        />
      ) : participantsState === 'error' ? (
        <ErrorState
          description="We could not load this event's attendance."
          onRetry={fetchParticipants}
        />
      ) : participantsState === 'loading' || !selectedEvent ? (
        <Card>
          <TableSkeleton rows={5} columns={3} />
        </Card>
      ) : (
        <>
          <AttendanceSummaryCards summary={summary} />

          <Card>
            <CardHeader
              title="Attendance"
              subtitle={`${selectedEvent.title} · ${formatEventDate(selectedEvent.eventDate, 'long')}`}
              actions={participants.length > 0 ? viewEventButton : undefined}
            />

            {participants.length === 0 ? (
              <EmptyState
                title="No one is registered yet"
                description="Participants are registered on the event's View Details page. Attendance can be taken once someone is registered."
                action={viewEventButton}
              />
            ) : (
              <ParticipantAttendanceTable
                participants={participants}
                canRecordAttendance={canManage}
                pendingRegistrationId={pendingRegistrationId}
                onToggleAttendance={handleToggleAttendance}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
