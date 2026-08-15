'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  AddIcon,
  ArchiveIcon,
  EditIcon,
  EyeIcon,
  MembersIcon,
  RestoreIcon,
} from '@/shared/components/icons';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Pagination,
  SearchInput,
  Select,
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

import { MEMBER_STATUS_FILTER_OPTIONS, MEMBER_STATUS_LABELS, MEMBER_TYPE_LABELS } from '../constants';
import {
  archiveMember,
  createMember,
  getMember,
  listMembers,
  listSchools,
  listScoutLevels,
  listTroops,
  MembersRequestError,
  restoreMember,
  updateMember,
} from '../services/members.service';
import type {
  Member,
  MemberFormValues,
  MemberStatusFilter,
  MemberSummary,
  MemberTypeFilter,
  SchoolOption,
  ScoutLevelOption,
  TroopOption,
} from '../types';
import { MemberFormModal } from './member-form-modal';
import { MemberStatusBadge } from './member-status-badge';

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

type ViewState = 'loading' | 'error' | 'ready';

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function toFormValues(member: Member): MemberFormValues {
  return {
    memberType: member.memberType,
    firstName: member.firstName,
    middleName: member.middleName ?? '',
    lastName: member.lastName,
    birthDate: member.birthDate ?? '',
    gender: (member.gender as MemberFormValues['gender']) ?? 'female',
    email: member.email ?? '',
    phoneNumber: member.phoneNumber ?? '',
    address: member.address ?? '',
    troopId: member.troop?.id ?? '',
    scoutLevelId: member.scoutLevel?.id ?? '',
    schoolId: member.school?.id ?? '',
    emergencyContactName: member.emergencyContactName ?? '',
    emergencyContactPhone: member.emergencyContactPhone ?? '',
    notes: member.notes ?? '',
  };
}

export interface MemberDirectoryProps {
  canArchive: boolean;
  /** Signed-in user's id, only when they're a Troop Leader — used to lock the Troop field. */
  currentUserId: string | null;
  isTroopLeader: boolean;
}

/**
 * Wire Read + Wire Write (Loop steps 4–5) for Feature 1.3. Fetches through this
 * app's own `/api/members` and `/api/organizations/*` BFF routes (never the Express
 * API directly, code-standards.md §7.4). Mutations refetch rather than update
 * optimistically (settled decision #3) — every write below re-runs `fetchMembers`.
 */
export function MemberDirectory({ canArchive, currentUserId, isTroopLeader }: MemberDirectoryProps) {
  const { showToast } = useToast();
  const router = useRouter();

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<MemberTypeFilter>('all');
  const [troopFilter, setTroopFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [troopOptions, setTroopOptions] = useState<TroopOption[]>([]);
  const [scoutLevelOptions, setScoutLevelOptions] = useState<ScoutLevelOption[]>([]);
  const [schoolOptions, setSchoolOptions] = useState<SchoolOption[]>([]);

  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; member: Member } | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<MemberSummary | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<MemberSummary | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch, statusFilter, typeFilter, troopFilter]);

  const fetchMembers = useCallback(async () => {
    setViewState('loading');
    try {
      const result = await listMembers({
        search: debouncedSearch || undefined,
        status: statusFilter,
        memberType: typeFilter,
        troopId: troopFilter !== 'all' ? troopFilter : undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setMembers(result.members);
      setTotalItems(result.totalItems);
      setViewState('ready');
    } catch {
      setViewState('error');
    }
  }, [debouncedSearch, statusFilter, typeFilter, troopFilter, page]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    listTroops().then(setTroopOptions).catch(() => setTroopOptions([]));
    listScoutLevels().then(setScoutLevelOptions).catch(() => setScoutLevelOptions([]));
    listSchools().then(setSchoolOptions).catch(() => setSchoolOptions([]));
  }, []);

  async function handleCreate(values: MemberFormValues) {
    const created = await createMember(values);
    setFormModal(null);
    showToast(`${created.firstName} ${created.lastName} registered — pending Council review.`, 'success');
    fetchMembers();
  }

  async function handleUpdate(values: MemberFormValues) {
    if (formModal?.mode !== 'edit') return;
    await updateMember(formModal.member.id, values);
    setFormModal(null);
    showToast(`${values.firstName} ${values.lastName}'s record was updated.`, 'success');
    fetchMembers();
  }

  /** Directory rows only carry `MemberSummary` — the edit form needs the full record. */
  async function openEditModal(member: MemberSummary) {
    setLoadingEditId(member.id);
    try {
      const full = await getMember(member.id);
      setFormModal({ mode: 'edit', member: full });
    } catch {
      showToast('Could not load this member for editing.', 'error');
    } finally {
      setLoadingEditId(null);
    }
  }

  async function confirmArchive() {
    if (!archiveTarget) return;
    setIsConfirming(true);
    try {
      await archiveMember(archiveTarget.id);
      showToast(`${archiveTarget.firstName} ${archiveTarget.lastName} archived.`, 'success');
      setArchiveTarget(null);
      fetchMembers();
    } catch (err) {
      showToast(err instanceof MembersRequestError ? err.message : 'Could not archive this member.', 'error');
    } finally {
      setIsConfirming(false);
    }
  }

  async function confirmRestore() {
    if (!restoreTarget) return;
    setIsConfirming(true);
    try {
      const restored = await restoreMember(restoreTarget.id);
      showToast(
        `${restoreTarget.firstName} ${restoreTarget.lastName} restored to ${MEMBER_STATUS_LABELS[restored.status]}.`,
        'success',
      );
      setRestoreTarget(null);
      fetchMembers();
    } catch (err) {
      showToast(err instanceof MembersRequestError ? err.message : 'Could not restore this member.', 'error');
    } finally {
      setIsConfirming(false);
    }
  }

  const ownTroop = isTroopLeader ? troopOptions.find((troop) => troop.leaderId === currentUserId) ?? null : undefined;
  const ownTroopId = isTroopLeader ? ownTroop?.id ?? null : undefined;
  const hasActiveFilters =
    debouncedSearch.length > 0 || statusFilter !== 'all' || typeFilter !== 'all' || troopFilter !== 'all';
  const columnCount = isTroopLeader ? 7 : 8;

  return (
    <Card>
      <CardHeader
        title={isTroopLeader && ownTroop ? <Badge tone="blue">{ownTroop.troopCode} — {ownTroop.name}</Badge> : undefined}
        subtitle={viewState === 'ready' ? `${totalItems.toLocaleString()} member${totalItems === 1 ? '' : 's'}` : undefined}
        actions={
          <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
            Register Member
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2.5">
        <SearchInput
          label="Search members"
          placeholder="Search name, email or troop code…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
          className="w-full sm:w-64"
        />
        <Select
          aria-label="Filter by status"
          className="w-full sm:w-48"
          options={MEMBER_STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as MemberStatusFilter)}
        />
        <Select
          aria-label="Filter by member type"
          className="w-full sm:w-44"
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'scout', label: 'Scout' },
            { value: 'adult_leader', label: 'Adult Leader' },
          ]}
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as MemberTypeFilter)}
        />
        {!isTroopLeader ? (
          <Select
            aria-label="Filter by troop"
            className="w-full sm:w-52"
            options={[
              { value: 'all', label: 'All Troops' },
              ...troopOptions.map((troop) => ({ value: troop.id, label: `${troop.troopCode} — ${troop.name}` })),
            ]}
            value={troopFilter}
            onChange={(event) => setTroopFilter(event.target.value)}
          />
        ) : null}
      </div>

      {viewState === 'loading' ? <TableSkeleton rows={6} columns={columnCount} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={fetchMembers} description="We could not load the membership registry. Check your connection and try again." />
      ) : null}

      {viewState === 'ready' && members.length === 0 && !hasActiveFilters ? (
        <EmptyState
          title="No members registered yet"
          description="Register the first scout or adult leader to start building the troop roster."
          action={
            <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
              Register Member
            </Button>
          }
        />
      ) : null}

      {viewState === 'ready' && members.length === 0 && hasActiveFilters ? (
        <EmptyState
          icon={MembersIcon}
          title="No members match your filters"
          description="Try a different search term or clear the filters."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setTypeFilter('all');
                setTroopFilter('all');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : null}

      {viewState === 'ready' && members.length > 0 ? (
        <>
          <TableWrapper>
            <Table caption="Registered members">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  {!isTroopLeader ? <TableHeaderCell>Troop</TableHeaderCell> : null}
                  <TableHeaderCell>Scout Level</TableHeaderCell>
                  <TableHeaderCell>School</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Joined</TableHeaderCell>
                  <TableHeaderCell>
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => {
                  const fullName = `${member.firstName} ${member.lastName}`;
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <TableAvatar name={fullName} />
                          <div>
                            <Link
                              href={`/members/${member.id}`}
                              className="font-semibold text-ink hover:text-brand-green hover:underline"
                            >
                              {fullName}
                            </Link>
                            {member.email ? <p className="text-[0.78rem] text-muted">{member.email}</p> : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{MEMBER_TYPE_LABELS[member.memberType]}</TableCell>
                      {!isTroopLeader ? (
                        <TableCell>
                          {member.troop ? (
                            <code className="rounded bg-subtle px-1.5 py-0.5 text-[0.8rem]">
                              {member.troop.troopCode}
                            </code>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                      ) : null}
                      <TableCell>{member.scoutLevel?.name ?? <span className="text-muted">—</span>}</TableCell>
                      <TableCell>{member.school?.name ?? <span className="text-muted">—</span>}</TableCell>
                      <TableCell>
                        <MemberStatusBadge status={member.status} />
                      </TableCell>
                      <TableCell>{toDisplayDate(member.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`View ${fullName}`}
                            onClick={() => router.push(`/members/${member.id}`)}
                          >
                            <EyeIcon aria-hidden />
                          </Button>
                          <Button
                            variant="gray"
                            size="sm"
                            aria-label={`Edit ${fullName}`}
                            isLoading={loadingEditId === member.id}
                            onClick={() => openEditModal(member)}
                          >
                            <EditIcon aria-hidden />
                          </Button>
                          {canArchive && member.status !== 'archived' ? (
                            <Button
                              variant="red"
                              size="sm"
                              aria-label={`Archive ${fullName}`}
                              onClick={() => setArchiveTarget(member)}
                            >
                              <ArchiveIcon aria-hidden />
                            </Button>
                          ) : null}
                          {canArchive && member.status === 'archived' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label={`Restore ${fullName}`}
                              onClick={() => setRestoreTarget(member)}
                            >
                              <RestoreIcon aria-hidden />
                            </Button>
                          ) : null}
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
            itemLabel="members"
          />
        </>
      ) : null}

      <MemberFormModal
        isOpen={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        initialValues={formModal?.mode === 'edit' ? toFormValues(formModal.member) : undefined}
        troopOptions={troopOptions}
        scoutLevelOptions={scoutLevelOptions}
        schoolOptions={schoolOptions}
        restrictToTroopId={ownTroopId}
        onClose={() => setFormModal(null)}
        onSubmit={formModal?.mode === 'edit' ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        isOpen={archiveTarget !== null}
        tone="danger"
        title="Archive member?"
        isConfirming={isConfirming}
        description={
          <>
            <strong>{archiveTarget ? `${archiveTarget.firstName} ${archiveTarget.lastName}` : ''}</strong>{' '}
            will be moved out of the active roster. This can be undone with Restore.
          </>
        }
        confirmLabel="Archive"
        onConfirm={confirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />

      <ConfirmDialog
        isOpen={restoreTarget !== null}
        tone="default"
        title="Restore member?"
        isConfirming={isConfirming}
        description={
          <>
            <strong>{restoreTarget ? `${restoreTarget.firstName} ${restoreTarget.lastName}` : ''}</strong>{' '}
            will be restored to the roster with the status they held before being archived.
          </>
        }
        confirmLabel="Restore"
        onConfirm={confirmRestore}
        onCancel={() => setRestoreTarget(null)}
      />
    </Card>
  );
}
