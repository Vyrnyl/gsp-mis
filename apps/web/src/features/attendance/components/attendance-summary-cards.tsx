import { AttendanceIcon, MembersIcon, RejectIcon, SuccessIcon } from '@/shared/components/icons';
import { StatCard, type StatCardTone } from '@/shared/components/ui';

import { attendanceRateTone } from '../constants';
import type { AttendanceSummary } from '../types';

const RATE_TONE_TO_STAT_TONE: Record<ReturnType<typeof attendanceRateTone>, StatCardTone> = {
  green: 'green',
  gold: 'gold',
  red: 'red',
};

export function AttendanceSummaryCards({ summary }: { summary: AttendanceSummary }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 xs:grid-cols-2 lg2:grid-cols-4">
      <StatCard icon={MembersIcon} value={summary.totalExpected} label="Registered" tone="blue" />
      <StatCard icon={SuccessIcon} value={summary.totalPresent} label="Present" tone="green" />
      <StatCard icon={RejectIcon} value={summary.totalAbsent} label="Absent" tone="red" />
      <StatCard
        icon={AttendanceIcon}
        value={`${summary.attendanceRate}%`}
        label="Attendance Rate"
        tone={RATE_TONE_TO_STAT_TONE[attendanceRateTone(summary.attendanceRate)]}
      />
    </div>
  );
}
