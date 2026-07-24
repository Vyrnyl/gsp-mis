'use client';

import { useState } from 'react';

import { EyeIcon, MembersIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  ProgressBar,
  Table,
  TableAvatar,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
} from '@/shared/components/ui';

import type { MemberProgressSummary, ViewState } from '../types';
import { MemberProgressDetailModal } from './member-progress-detail-modal';

export interface MemberProgressPanelProps {
  viewState: ViewState;
  members: MemberProgressSummary[];
  canVerify: boolean;
  onRetry: () => void;
  onVerify: (memberBadgeId: string) => Promise<void>;
  verifyingId: string | null;
}

/** Progress tracker — registry §3 `ProgressBar`. Replaces the prototype's static "Member Badge Progress" table. */
export function MemberProgressPanel({
  viewState,
  members,
  canVerify,
  onRetry,
  onVerify,
  verifyingId,
}: MemberProgressPanelProps) {
  // Tracks the id, not the row object, so the modal re-reads live data from `members`
  // on every render instead of freezing the snapshot captured when "View" was clicked
  // — otherwise verifying a badge wouldn't visibly flip it to "Verified" in the modal.
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null);
  const detailMember = members.find((member) => member.memberId === detailMemberId) ?? null;

  return (
    <Card>
      <CardHeader
        title="Member Badge Progress"
        subtitle={viewState === 'ready' ? `${members.length.toLocaleString()} members` : undefined}
      />

      {viewState === 'loading' ? <TableSkeleton rows={4} columns={4} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={onRetry} description="We could not load member progress. Check your connection and try again." />
      ) : null}

      {viewState === 'ready' && members.length === 0 ? (
        <EmptyState
          icon={MembersIcon}
          title="No badge progress recorded yet"
          description="Once a badge is recorded for a member, their progress will appear here."
        />
      ) : null}

      {viewState === 'ready' && members.length > 0 ? (
        <TableWrapper>
          <Table caption="Member badge progress">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Member</TableHeaderCell>
                <TableHeaderCell>Troop</TableHeaderCell>
                <TableHeaderCell>Badges Earned</TableHeaderCell>
                <TableHeaderCell>Progress</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">Actions</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.memberId}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <TableAvatar name={member.memberName} />
                      <span className="whitespace-nowrap">{member.memberName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap">{member.troopName ?? '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap">
                      {member.earnedCount} / {member.totalBadges}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ProgressBar
                      className="w-28"
                      value={member.progressPercent}
                      label={`${member.memberName} — ${member.progressPercent}% of badges earned`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        leadingIcon={<EyeIcon aria-hidden />}
                        onClick={() => setDetailMemberId(member.memberId)}
                      >
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      ) : null}

      <MemberProgressDetailModal
        member={detailMember}
        canVerify={canVerify}
        verifyingId={verifyingId}
        onVerify={onVerify}
        onClose={() => setDetailMemberId(null)}
      />
    </Card>
  );
}
