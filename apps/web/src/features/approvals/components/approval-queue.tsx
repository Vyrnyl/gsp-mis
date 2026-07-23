'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { EyeIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Pagination,
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

import { MEMBER_TYPE_LABELS } from '@/features/members/constants';
import {
  approveMember,
  getMember,
  listPendingMembers,
  MembersRequestError,
  rejectMember,
} from '@/features/members/services/members.service';
import type { Member, MemberSummary } from '@/features/members/types';

import { ApprovalReviewModal } from './approval-review-modal';

const PAGE_SIZE = 8;

type ViewState = 'loading' | 'error' | 'ready';

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Wire Read + Wire Write (Loop steps 4–5) for Feature 1.4. Fetches through this
 * app's own `/api/members/pending` BFF route (never the Express API directly,
 * code-standards.md §7.4). Approve/reject refetch the queue afterward rather than
 * patching local state (settled decision #3), same convention as `MemberDirectory`.
 */
export function ApprovalQueue() {
  const { showToast } = useToast();

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [pendingMembers, setPendingMembers] = useState<MemberSummary[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);

  const [reviewMember, setReviewMember] = useState<Member | null>(null);
  const [loadingReviewId, setLoadingReviewId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setViewState('loading');
    try {
      const result = await listPendingMembers({ page, pageSize: PAGE_SIZE });
      setPendingMembers(result.members);
      setTotalItems(result.totalItems);
      setViewState('ready');
    } catch {
      setViewState('error');
    }
  }, [page]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const isReviewModalOpen = useMemo(() => reviewMember !== null, [reviewMember]);

  async function openReview(member: MemberSummary) {
    setLoadingReviewId(member.id);
    try {
      const full = await getMember(member.id);
      setReviewMember(full);
    } catch {
      showToast('Could not load this registration for review.', 'error');
    } finally {
      setLoadingReviewId(null);
    }
  }

  async function handleApprove(memberId: string) {
    const member = pendingMembers.find((candidate) => candidate.id === memberId);
    try {
      await approveMember(memberId);
      setReviewMember(null);
      showToast(`${member?.firstName ?? 'Member'} ${member?.lastName ?? ''} approved — now active.`, 'success');
      fetchPending();
    } catch (err) {
      showToast(err instanceof MembersRequestError ? err.message : 'Could not approve this registration.', 'error');
    }
  }

  async function handleReject(memberId: string, reason: string) {
    const member = pendingMembers.find((candidate) => candidate.id === memberId);
    try {
      await rejectMember(memberId, reason);
      setReviewMember(null);
      showToast(`${member?.firstName ?? 'Member'} ${member?.lastName ?? ''}'s registration was rejected.`, 'success');
      fetchPending();
    } catch (err) {
      showToast(err instanceof MembersRequestError ? err.message : 'Could not reject this registration.', 'error');
    }
  }

  return (
    <Card>
      <CardHeader
        title="Pending Registrations"
        subtitle={viewState === 'ready' ? `${totalItems.toLocaleString()} awaiting review` : undefined}
      />

      {viewState === 'loading' ? <TableSkeleton rows={5} columns={5} /> : null}

      {viewState === 'error' ? (
        <ErrorState
          onRetry={fetchPending}
          description="We could not load the approval queue. Check your connection and try again."
        />
      ) : null}

      {viewState === 'ready' && pendingMembers.length === 0 ? (
        <EmptyState
          title="Nothing waiting for review"
          description="New scout and adult leader registrations from Membership Registry will appear here."
        />
      ) : null}

      {viewState === 'ready' && pendingMembers.length > 0 ? (
        <>
          <TableWrapper>
            <Table caption="Pending membership registrations">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Troop</TableHeaderCell>
                  <TableHeaderCell>Submitted</TableHeaderCell>
                  <TableHeaderCell>
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingMembers.map((member) => {
                  const fullName = `${member.firstName} ${member.lastName}`;
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <TableAvatar name={fullName} />
                          <div>
                            <p className="font-semibold text-ink">{fullName}</p>
                            {member.email ? <p className="text-[0.78rem] text-muted">{member.email}</p> : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{MEMBER_TYPE_LABELS[member.memberType]}</TableCell>
                      <TableCell>
                        {member.troop ? (
                          <code className="whitespace-nowrap rounded bg-subtle px-1.5 py-0.5 text-[0.8rem]">
                            {member.troop.troopCode}
                          </code>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </TableCell>
                      <TableCell>{toDisplayDate(member.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            leadingIcon={<EyeIcon aria-hidden />}
                            isLoading={loadingReviewId === member.id}
                            onClick={() => openReview(member)}
                          >
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrapper>

          <Pagination
            className="mt-4"
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={totalItems}
            onPageChange={setPage}
            itemLabel="pending registrations"
          />
        </>
      ) : null}

      <ApprovalReviewModal
        isOpen={isReviewModalOpen}
        member={reviewMember}
        onClose={() => setReviewMember(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </Card>
  );
}
