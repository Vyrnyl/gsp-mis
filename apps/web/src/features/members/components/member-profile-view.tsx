'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  ArchiveIcon,
  ChevronLeftIcon,
  EditIcon,
  RestoreIcon,
  RetryIcon,
} from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  CardSkeleton,
  ConfirmDialog,
  ErrorState,
  Table,
  TableAvatar,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrapper,
  useToast,
} from '@/shared/components/ui';

import { MEMBER_STATUS_LABELS, MEMBER_TYPE_LABELS } from '../constants';
import {
  archiveMember,
  getMember,
  listScoutLevels,
  listTroops,
  MembersRequestError,
  renewMembership,
  restoreMember,
  updateMember,
} from '../services/members.service';
import type { Member, MemberFormValues, RenewMembershipValues, ScoutLevelOption, TroopOption } from '../types';
import { MemberFormModal } from './member-form-modal';
import { MemberStatusBadge } from './member-status-badge';
import { RenewMembershipModal } from './renew-membership-modal';

function toDisplayDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

const MEMBERSHIP_STATUS_LABEL: Record<Member['memberships'][number]['status'], string> = {
  active: 'Active',
  expiring: 'Expiring Soon',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

function toFormValues(member: Member): MemberFormValues {
  return {
    memberType: member.memberType,
    firstName: member.firstName,
    middleName: member.middleName ?? '',
    lastName: member.lastName,
    birthDate: member.birthDate ?? '',
    gender: member.gender,
    email: member.email ?? '',
    phoneNumber: member.phoneNumber ?? '',
    address: member.address ?? '',
    troopId: member.troop?.id ?? '',
    scoutLevelId: member.scoutLevel?.id ?? '',
    emergencyContactName: member.emergencyContactName ?? '',
    emergencyContactPhone: member.emergencyContactPhone ?? '',
    notes: member.notes ?? '',
  };
}

type ViewState = 'loading' | 'error' | 'not-found' | 'ready';

export interface MemberProfileViewProps {
  memberId: string;
  canArchive: boolean;
  /** Signed-in user's id, only when they're a Troop Leader — used to lock the Troop field. */
  currentUserId: string | null;
  isTroopLeader: boolean;
}

/**
 * Wire Read + Wire Write (Loop steps 4–5) for Feature 1.3. Real `GET /api/members/:id`
 * lookup; every mutation refetches the member afterward rather than patching local
 * state (settled decision #3), same convention as `MemberDirectory`.
 */
export function MemberProfileView({ memberId, canArchive, currentUserId, isTroopLeader }: MemberProfileViewProps) {
  const { showToast } = useToast();

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [member, setMember] = useState<Member | null>(null);
  const [troopOptions, setTroopOptions] = useState<TroopOption[]>([]);
  const [scoutLevelOptions, setScoutLevelOptions] = useState<ScoutLevelOption[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [confirmTone, setConfirmTone] = useState<'archive' | 'restore' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchMember = useCallback(async () => {
    setViewState('loading');
    try {
      const found = await getMember(memberId);
      setMember(found);
      setViewState('ready');
    } catch (err) {
      if (err instanceof MembersRequestError && err.message.toLowerCase().includes('not found')) {
        setViewState('not-found');
      } else {
        setViewState('error');
      }
    }
  }, [memberId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  useEffect(() => {
    listTroops().then(setTroopOptions).catch(() => setTroopOptions([]));
    listScoutLevels().then(setScoutLevelOptions).catch(() => setScoutLevelOptions([]));
  }, []);

  async function handleEditSubmit(values: MemberFormValues) {
    await updateMember(memberId, values);
    setIsEditOpen(false);
    showToast('Member record updated.', 'success');
    fetchMember();
  }

  async function handleRenew(values: RenewMembershipValues) {
    await renewMembership(memberId, values);
    setIsRenewOpen(false);
    showToast('Membership renewed.', 'success');
    fetchMember();
  }

  async function confirmArchiveToggle() {
    if (!confirmTone) return;
    setIsConfirming(true);
    try {
      if (confirmTone === 'archive') {
        await archiveMember(memberId);
        showToast('Member archived.', 'success');
      } else {
        const restored = await restoreMember(memberId);
        showToast(`Member restored to ${MEMBER_STATUS_LABELS[restored.status]}.`, 'success');
      }
      setConfirmTone(null);
      fetchMember();
    } catch (err) {
      showToast(err instanceof MembersRequestError ? err.message : 'Something went wrong.', 'error');
    } finally {
      setIsConfirming(false);
    }
  }

  const backLink = (
    <Link
      href="/members"
      className="mb-4 inline-flex items-center gap-1 text-[0.85rem] font-semibold text-brand-green hover:underline"
    >
      <ChevronLeftIcon aria-hidden /> Back to Directory
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
        <ErrorState onRetry={fetchMember} description="We could not load this member's profile." />
      </div>
    );
  }

  if (viewState === 'not-found' || !member) {
    return (
      <div>
        {backLink}
        <ErrorState
          title="Member not found"
          description="This member may have been removed, or the link is incorrect."
          onRetry={fetchMember}
          retryLabel="Try again"
        />
      </div>
    );
  }

  const fullName = `${member.firstName} ${member.middleName ? `${member.middleName} ` : ''}${member.lastName}`;
  const canRenew = member.status === 'active' || member.status === 'expiring' || member.status === 'expired';
  const ownTroopId = isTroopLeader ? troopOptions.find((troop) => troop.leaderId === currentUserId)?.id ?? null : undefined;

  return (
    <div>
      {backLink}

      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <TableAvatar name={fullName} className="size-14 text-lg" />
            <div>
              <h2 className="text-xl font-bold text-ink">{fullName}</h2>
              <p className="mt-0.5 text-[0.85rem] text-muted">
                {MEMBER_TYPE_LABELS[member.memberType]}
                {member.troop ? ` · ${member.troop.troopCode} — ${member.troop.name}` : ''}
              </p>
              <div className="mt-2">
                <MemberStatusBadge status={member.status} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="gray" leadingIcon={<EditIcon aria-hidden />} onClick={() => setIsEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant="blue"
              leadingIcon={<RetryIcon aria-hidden />}
              disabled={!canRenew}
              onClick={() => setIsRenewOpen(true)}
            >
              Renew Membership
            </Button>
            {canArchive && member.status !== 'archived' ? (
              <Button variant="red" leadingIcon={<ArchiveIcon aria-hidden />} onClick={() => setConfirmTone('archive')}>
                Archive
              </Button>
            ) : null}
            {canArchive && member.status === 'archived' ? (
              <Button variant="outline" leadingIcon={<RestoreIcon aria-hidden />} onClick={() => setConfirmTone('restore')}>
                Restore
              </Button>
            ) : null}
          </div>
        </div>

        {member.rejectionReason ? (
          <p className="mt-4 rounded-field bg-status-danger-bg px-3.5 py-2.5 text-[0.85rem] text-status-danger-fg">
            <strong>Rejected:</strong> {member.rejectionReason}
          </p>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg2:grid-cols-3">
        <Card className="lg2:col-span-2">
          <CardHeader title="Personal Information" as="h3" />
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <ProfileField label="Birthdate" value={toDisplayDate(member.birthDate)} />
            <ProfileField label="Gender" value={member.gender} className="capitalize" />
            <ProfileField label="Email" value={member.email ?? '—'} />
            <ProfileField label="Phone Number" value={member.phoneNumber ?? '—'} />
            <ProfileField label="Home Address" value={member.address ?? '—'} className="sm:col-span-2" />
            {member.memberType === 'scout' ? (
              <ProfileField label="Scout Level" value={member.scoutLevel?.name ?? '—'} />
            ) : null}
            <ProfileField label="Council" value={member.councilName ?? '—'} />
          </dl>
        </Card>

        <Card>
          <CardHeader title="Emergency Contact" as="h3" />
          <dl className="grid grid-cols-1 gap-y-4">
            <ProfileField label="Name" value={member.emergencyContactName ?? '—'} />
            <ProfileField label="Phone" value={member.emergencyContactPhone ?? '—'} />
          </dl>
          {member.notes ? (
            <>
              <hr className="my-4 border-hairline-subtle" />
              <p className="text-[0.8rem] font-semibold uppercase tracking-[0.03em] text-ink-subtle">Notes</p>
              <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-soft">{member.notes}</p>
            </>
          ) : null}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Membership History" subtitle="Newest term first — renewal always adds a new row" as="h3" />
        {member.memberships.length === 0 ? (
          <p className="py-6 text-center text-[0.88rem] text-muted">
            No membership terms yet. Renewal starts once the registration is approved.
          </p>
        ) : (
          <TableWrapper>
            <Table caption={`Membership history for ${fullName}`}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Start Date</TableHeaderCell>
                  <TableHeaderCell>End Date</TableHeaderCell>
                  <TableHeaderCell>Renewed On</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {member.memberships.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell>{toDisplayDate(term.startDate)}</TableCell>
                    <TableCell>{toDisplayDate(term.endDate)}</TableCell>
                    <TableCell>{toDisplayDate(term.renewalDate)}</TableCell>
                    <TableCell>{MEMBERSHIP_STATUS_LABEL[term.status]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        )}
      </Card>

      <MemberFormModal
        isOpen={isEditOpen}
        mode="edit"
        initialValues={toFormValues(member)}
        troopOptions={troopOptions}
        scoutLevelOptions={scoutLevelOptions}
        restrictToTroopId={ownTroopId}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <RenewMembershipModal
        isOpen={isRenewOpen}
        memberName={fullName}
        onClose={() => setIsRenewOpen(false)}
        onSubmit={handleRenew}
      />

      <ConfirmDialog
        isOpen={confirmTone !== null}
        tone={confirmTone === 'archive' ? 'danger' : 'default'}
        isConfirming={isConfirming}
        title={confirmTone === 'archive' ? 'Archive member?' : 'Restore member?'}
        description={
          confirmTone === 'archive' ? (
            <>
              <strong>{fullName}</strong> will be moved out of the active roster. This can be undone with
              Restore.
            </>
          ) : (
            <>
              <strong>{fullName}</strong> will be restored to the roster with the status they held before being
              archived.
            </>
          )
        }
        confirmLabel={confirmTone === 'archive' ? 'Archive' : 'Restore'}
        onConfirm={confirmArchiveToggle}
        onCancel={() => setConfirmTone(null)}
      />
    </div>
  );
}

function ProfileField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.03em] text-ink-subtle">{label}</dt>
      <dd className="mt-1 text-[0.92rem] text-ink">{value}</dd>
    </div>
  );
}
