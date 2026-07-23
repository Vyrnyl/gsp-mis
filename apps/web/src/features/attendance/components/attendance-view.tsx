'use client';

import { useCallback, useEffect, useState } from 'react';

import { AddIcon, EventIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Select,
  TableSkeleton,
  useToast,
} from '@/shared/components/ui';

import { listAllEvents } from '@/features/events/services/events.service';
import type { EventSummary } from '@/features/events/types';
import { formatEventDate } from '@/features/events/utils';
import { listMembers } from '@/features/members/services/members.service';

import { AttendanceSummaryCards } from './attendance-summary-cards';
import { ParticipantAttendanceTable } from './participant-attendance-table';
import { RegisterParticipantModal } from './register-participant-modal';
import {
  AttendanceRequestError,
  listParticipants,
  recordAttendance,
  registerParticipant,
  updateRegistrationStatus,
} from '../services/attendance.service';
import type { AttendanceSummary, Participant, RegistrableMember } from '../types';

type ViewState = 'loading' | 'error' | 'ready';

export interface AttendanceViewProps {
  /** Gates registering participants, cancelling registrations, and recording
   * attendance — `attendance:write` (Admin + Troop Leader; Executive Council reads
   * only, per project-overview.md's monitoring-only Activity Monitoring section). */
  canManage: boolean;
  initialEventId?: string;
}

export function AttendanceView({ canManage, initialEventId }: AttendanceViewProps) {
  const { showToast } = useToast();

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

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [candidates, setCandidates] = useState<RegistrableMember[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [pendingRegistrationId, setPendingRegistrationId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Participant | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

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
      setParticipants(result.participants);
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

  async function openRegisterModal() {
    setIsRegisterOpen(true);
    setCandidatesLoading(true);
    try {
      const { members } = await listMembers({ status: 'active', pageSize: 100 });
      const participatingMemberIds = new Set(participants.map((p) => p.memberId));
      setCandidates(
        members
          .filter((member) => !participatingMemberIds.has(member.id))
          .map((member) => ({
            id: member.id,
            fullName: `${member.firstName} ${member.lastName}`,
            troopName: member.troop?.name ?? null,
          })),
      );
    } catch {
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  }

  async function handleToggleAttendance(participant: Participant, next: 'present' | 'absent') {
    if (!selectedEventId) return;
    setPendingRegistrationId(participant.registrationId);
    try {
      await recordAttendance(selectedEventId, participant.memberId, next);
      await fetchParticipants();
    } catch (err) {
      showToast(err instanceof AttendanceRequestError ? err.message : 'Could not record attendance.', 'error');
    } finally {
      setPendingRegistrationId(null);
    }
  }

  async function handleRegister(member: RegistrableMember) {
    if (!selectedEventId) return;
    setRegisteringId(member.id);
    try {
      await registerParticipant(selectedEventId, member.id);
      showToast(`${member.fullName} registered.`, 'success');
      setIsRegisterOpen(false);
      await fetchParticipants();
    } catch (err) {
      showToast(err instanceof AttendanceRequestError ? err.message : 'Could not register this member.', 'error');
    } finally {
      setRegisteringId(null);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget || !selectedEventId) return;
    setIsConfirmingCancel(true);
    try {
      await updateRegistrationStatus(selectedEventId, cancelTarget.memberId, 'cancelled');
      showToast(`${cancelTarget.fullName}'s registration was cancelled.`, 'success');
      setCancelTarget(null);
      await fetchParticipants();
    } catch (err) {
      showToast(err instanceof AttendanceRequestError ? err.message : 'Could not cancel this registration.', 'error');
    } finally {
      setIsConfirmingCancel(false);
    }
  }

  async function handleReactivate(participant: Participant) {
    if (!selectedEventId) return;
    setPendingRegistrationId(participant.registrationId);
    try {
      await updateRegistrationStatus(selectedEventId, participant.memberId, 'registered');
      showToast(`${participant.fullName} re-registered.`, 'success');
      await fetchParticipants();
    } catch (err) {
      showToast(err instanceof AttendanceRequestError ? err.message : 'Could not re-register this member.', 'error');
    } finally {
      setPendingRegistrationId(null);
    }
  }

  return (
    <div>
      <Card className="mb-6">
        <div className="w-full sm:w-72">
          <label htmlFor="attendance-event-picker" className="mb-1.5 block text-[0.85rem] font-semibold text-ink">
            Event
          </label>
          {eventsState === 'ready' && events.length === 0 ? (
            <p className="text-[0.88rem] text-muted">No events yet.</p>
          ) : (
            <Select
              id="attendance-event-picker"
              disabled={eventsState !== 'ready'}
              options={events.map((event) => ({ value: event.id, label: event.title }))}
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
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
          description="We could not load this event's participants and attendance."
          onRetry={fetchParticipants}
        />
      ) : participantsState === 'loading' || !selectedEvent ? (
        <Card>
          <TableSkeleton rows={5} columns={5} />
        </Card>
      ) : (
        <>
          <AttendanceSummaryCards summary={summary} />

          <Card>
            <CardHeader
              title="Participants & Attendance"
              subtitle={`${selectedEvent.title} · ${formatEventDate(selectedEvent.eventDate, 'long')}`}
              actions={
                canManage ? (
                  <Button leadingIcon={<AddIcon aria-hidden />} onClick={openRegisterModal}>
                    Register Participant
                  </Button>
                ) : undefined
              }
            />

            {participants.length === 0 ? (
              <EmptyState
                title="No one is registered yet"
                description="Register the first participant to start taking attendance for this event."
                action={
                  canManage ? (
                    <Button leadingIcon={<AddIcon aria-hidden />} onClick={openRegisterModal}>
                      Register Participant
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ParticipantAttendanceTable
                participants={participants}
                canRecordAttendance={canManage}
                canManageRegistrations={canManage}
                pendingRegistrationId={pendingRegistrationId}
                onToggleAttendance={handleToggleAttendance}
                onCancelRegistration={setCancelTarget}
                onReactivateRegistration={handleReactivate}
              />
            )}
          </Card>
        </>
      )}

      <RegisterParticipantModal
        isOpen={isRegisterOpen}
        candidates={candidatesLoading ? [] : candidates}
        registeringId={registeringId}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={handleRegister}
      />

      <ConfirmDialog
        isOpen={cancelTarget !== null}
        tone="danger"
        title="Cancel registration?"
        isConfirming={isConfirmingCancel}
        description={
          <>
            <strong>{cancelTarget?.fullName}</strong> will be removed from this event&apos;s active roster. This
            can be undone by re-registering them.
          </>
        }
        confirmLabel="Cancel Registration"
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
