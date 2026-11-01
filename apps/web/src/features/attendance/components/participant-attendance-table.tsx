'use client';

import {
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

import type { AttendanceMark, Participant } from '../types';

const ATTENDANCE_LABEL: Record<NonNullable<AttendanceMark>, string> = {
  present: 'Present',
  absent: 'Absent',
};

export interface ParticipantAttendanceTableProps {
  /** Active registrations only. Who is on the roster is managed on the event's own page. */
  participants: Participant[];
  /** Toggle present/absent — Admin + Troop Leader only (`attendance:write`). */
  canRecordAttendance: boolean;
  onToggleAttendance: (participant: Participant, next: 'present' | 'absent') => void;
  /** Registration currently being mutated — disables that row's toggle so a slow request
   * can't be double-fired. */
  pendingRegistrationId?: string | null;
}

export function ParticipantAttendanceTable({
  participants,
  canRecordAttendance,
  onToggleAttendance,
  pendingRegistrationId = null,
}: ParticipantAttendanceTableProps) {
  return (
    <TableWrapper>
      <Table caption="Attendance for this event">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Member</TableHeaderCell>
            <TableHeaderCell>Troop</TableHeaderCell>
            <TableHeaderCell>Attendance</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {participants.map((participant) => {
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
                      {participant.attendanceStatus
                        ? ATTENDANCE_LABEL[participant.attendanceStatus]
                        : 'Not recorded'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableWrapper>
  );
}
