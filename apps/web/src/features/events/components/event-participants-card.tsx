'use client';

import { useCallback, useEffect, useState } from 'react';

import { AddIcon, CloseIcon, MembersIcon, RestoreIcon } from '@/shared/components/icons';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Table,
  TableAvatar,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
  useToast,
} from '@/shared/components/ui';

import {
  AttendanceRequestError,
  listParticipants,
  registerParticipant,
  updateRegistrationStatus,
} from '@/features/attendance/services/attendance.service';
import type {
  Participant,
  RegistrableMember,
  RegistrationStatus,
} from '@/features/attendance/types';
import { listMembers } from '@/features/members/services/members.service';

import { RegisterParticipantModal } from './register-participant-modal';

type ViewState = 'loading' | 'error' | 'ready';

const REGISTRATION_BADGE: Record<RegistrationStatus, { tone: 'green' | 'gray'; label: string }> = {
  registered: { tone: 'green', label: 'Registered' },
  cancelled: { tone: 'gray', label: 'Cancelled' },
};

export interface EventParticipantsCardProps {
  eventId: string;
  /** Register, cancel and re-register — `attendance:write` (Admin + Troop Leader). */
  canManage: boolean;
  /** Keeps the page's registered count right without reloading the whole event. */
  onRegisteredCountChange: (count: number) => void;
}

/** The event's roster. Present/absent marking stays on the Attendance page. */
export function EventParticipantsCard({
  eventId,
  canManage,
  onRegisteredCountChange,
}: EventParticipantsCardProps) {
  const { showToast } = useToast();

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [candidates, setCandidates] = useState<RegistrableMember[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [pendingRegistrationId, setPendingRegistrationId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Participant | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  const fetchParticipants = useCallback(async () => {
    setViewState('loading');
    try {
      const result = await listParticipants(eventId);
      setParticipants(result.participants);
      onRegisteredCountChange(result.summary.totalExpected);
      setViewState('ready');
    } catch {
      setViewState('error');
    }
  }, [eventId, onRegisteredCountChange]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

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

  async function handleRegister(member: RegistrableMember) {
    setRegisteringId(member.id);
    try {
      await registerParticipant(eventId, member.id);
      showToast(`${member.fullName} registered.`, 'success');
      setIsRegisterOpen(false);
      await fetchParticipants();
    } catch (err) {
      showToast(
        err instanceof AttendanceRequestError ? err.message : 'Could not register this member.',
        'error',
      );
    } finally {
      setRegisteringId(null);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setIsConfirmingCancel(true);
    try {
      await updateRegistrationStatus(eventId, cancelTarget.memberId, 'cancelled');
      showToast(`${cancelTarget.fullName}'s registration was cancelled.`, 'success');
      setCancelTarget(null);
      await fetchParticipants();
    } catch (err) {
      showToast(
        err instanceof AttendanceRequestError ? err.message : 'Could not cancel this registration.',
        'error',
      );
    } finally {
      setIsConfirmingCancel(false);
    }
  }

  async function handleReactivate(participant: Participant) {
    setPendingRegistrationId(participant.registrationId);
    try {
      await updateRegistrationStatus(eventId, participant.memberId, 'registered');
      showToast(`${participant.fullName} re-registered.`, 'success');
      await fetchParticipants();
    } catch (err) {
      showToast(
        err instanceof AttendanceRequestError ? err.message : 'Could not re-register this member.',
        'error',
      );
    } finally {
      setPendingRegistrationId(null);
    }
  }

  const registerButton = canManage ? (
    <Button leadingIcon={<AddIcon aria-hidden />} onClick={openRegisterModal}>
      Register Participant
    </Button>
  ) : undefined;

  return (
    <Card className="mt-6">
      <CardHeader
        title="Participants"
        as="h3"
        actions={viewState === 'ready' && participants.length > 0 ? registerButton : undefined}
      />

      {viewState === 'loading' ? <TableSkeleton rows={4} columns={5} /> : null}

      {viewState === 'error' ? (
        <ErrorState
          onRetry={fetchParticipants}
          description="We could not load this event's participants."
        />
      ) : null}

      {viewState === 'ready' && participants.length === 0 ? (
        <EmptyState
          icon={MembersIcon}
          title="No one is registered yet"
          description={
            canManage
              ? 'Register the first participant for this event.'
              : 'Registered members will appear here.'
          }
          action={registerButton}
        />
      ) : null}

      {viewState === 'ready' && participants.length > 0 ? (
        <TableWrapper>
          <Table caption="Event participants">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Member</TableHeaderCell>
                <TableHeaderCell>Scout Level</TableHeaderCell>
                <TableHeaderCell>Troop</TableHeaderCell>
                <TableHeaderCell>Registration</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">Actions</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((participant) => {
                const registrationBadge = REGISTRATION_BADGE[participant.registrationStatus];
                const isPending = pendingRegistrationId === participant.registrationId;

                return (
                  <TableRow key={participant.registrationId}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <TableAvatar name={participant.fullName} />
                        <span className="whitespace-nowrap font-semibold text-ink">
                          {participant.fullName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {participant.scoutLevelName ? (
                        <span className="whitespace-nowrap text-ink">
                          {participant.scoutLevelName}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {participant.troop?.troopCode ? (
                        <code className="whitespace-nowrap rounded bg-subtle px-1.5 py-0.5 text-[0.8rem]">
                          {participant.troop.troopCode}
                        </code>
                      ) : participant.troop?.name ? (
                        <span className="text-ink">{participant.troop.name}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge tone={registrationBadge.tone}>{registrationBadge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <div className="flex justify-end">
                          {participant.registrationStatus === 'cancelled' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label={`Re-register ${participant.fullName}`}
                              isLoading={isPending}
                              onClick={() => handleReactivate(participant)}
                            >
                              <RestoreIcon aria-hidden />
                            </Button>
                          ) : (
                            <Button
                              variant="red"
                              size="sm"
                              aria-label={`Cancel ${participant.fullName}'s registration`}
                              disabled={isPending}
                              onClick={() => setCancelTarget(participant)}
                            >
                              <CloseIcon aria-hidden />
                            </Button>
                          )}
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrapper>
      ) : null}

      <RegisterParticipantModal
        isOpen={isRegisterOpen}
        isLoading={candidatesLoading}
        candidates={candidates}
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
            <strong>{cancelTarget?.fullName}</strong> will be removed from this event&apos;s active
            roster. This can be undone by re-registering them.
          </>
        }
        confirmLabel="Cancel Registration"
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </Card>
  );
}
