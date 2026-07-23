'use client';

import { CloseIcon, RestoreIcon } from '@/shared/components/icons';
import {
  Badge,
  Button,
  Table,
  TableAvatar,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrapper,
  ToggleSwitch,
} from '@/shared/components/ui';

import type { AttendanceMark, Participant, RegistrationStatus } from '../types';

const REGISTRATION_BADGE: Record<RegistrationStatus, { tone: 'green' | 'gray'; label: string }> = {
  registered: { tone: 'green', label: 'Registered' },
  cancelled: { tone: 'gray', label: 'Cancelled' },
};

const ATTENDANCE_LABEL: Record<NonNullable<AttendanceMark>, string> = {
  present: 'Present',
  absent: 'Absent',
};

export interface ParticipantAttendanceTableProps {
  participants: Participant[];
  /** Toggle present/absent — Admin + Troop Leader only (`attendance:write`). */
  canRecordAttendance: boolean;
  /** Cancel/reactivate a registration — Admin + Troop Leader only (`attendance:write`,
   * same permission that gates registering someone in the first place). */
  canManageRegistrations: boolean;
  onToggleAttendance: (participant: Participant, next: 'present' | 'absent') => void;
  onCancelRegistration: (participant: Participant) => void;
  onReactivateRegistration: (participant: Participant) => void;
  /** Registration currently being mutated (attendance toggle or reactivate) —
   * disables that row's controls so a slow request can't be double-fired. */
  pendingRegistrationId?: string | null;
}

export function ParticipantAttendanceTable({
  participants,
  canRecordAttendance,
  canManageRegistrations,
  onToggleAttendance,
  onCancelRegistration,
  onReactivateRegistration,
  pendingRegistrationId = null,
}: ParticipantAttendanceTableProps) {
  return (
    <TableWrapper>
      <Table caption="Event participants and their attendance">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Member</TableHeaderCell>
            <TableHeaderCell>Troop</TableHeaderCell>
            <TableHeaderCell>Registration</TableHeaderCell>
            <TableHeaderCell>Attendance</TableHeaderCell>
            <TableHeaderCell>
              <span className="sr-only">Actions</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {participants.map((participant) => {
            const registrationBadge = REGISTRATION_BADGE[participant.registrationStatus];
            const isCancelled = participant.registrationStatus === 'cancelled';
            const isPending = pendingRegistrationId === participant.registrationId;

            return (
              <TableRow key={participant.registrationId}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <TableAvatar name={participant.fullName} />
                    <span className="font-semibold text-ink">{participant.fullName}</span>
                  </div>
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
                  {isCancelled ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <div className="flex items-center gap-2.5 whitespace-nowrap">
                      <ToggleSwitch
                        label={`Mark ${participant.fullName} present`}
                        hideLabel
                        disabled={!canRecordAttendance || isPending}
                        checked={participant.attendanceStatus === 'present'}
                        onChange={(event) =>
                          onToggleAttendance(participant, event.target.checked ? 'present' : 'absent')
                        }
                      />
                      <span
                        className={
                          participant.attendanceStatus === 'present'
                            ? 'text-[0.85rem] font-semibold text-status-success-fg'
                            : participant.attendanceStatus === 'absent'
                              ? 'text-[0.85rem] font-semibold text-status-danger-fg'
                              : 'text-[0.85rem] text-muted'
                        }
                      >
                        {participant.attendanceStatus ? ATTENDANCE_LABEL[participant.attendanceStatus] : 'Not recorded'}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {canManageRegistrations ? (
                    <div className="flex justify-end">
                      {isCancelled ? (
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Re-register ${participant.fullName}`}
                          isLoading={isPending}
                          onClick={() => onReactivateRegistration(participant)}
                        >
                          <RestoreIcon aria-hidden />
                        </Button>
                      ) : (
                        <Button
                          variant="red"
                          size="sm"
                          aria-label={`Cancel ${participant.fullName}'s registration`}
                          disabled={isPending}
                          onClick={() => onCancelRegistration(participant)}
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
  );
}
