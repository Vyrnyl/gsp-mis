'use client';

import { useState } from 'react';

import {
  AddIcon,
  EditIcon,
  MembersIcon,
  PasswordIcon,
  RejectIcon,
  SuccessIcon,
  DeleteIcon,
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
} from '@/shared/components/ui';

import { ROLE_BADGE_TONES, USER_ROLE_FILTER_OPTIONS } from '../constants';
import type { CreateUserFormValues, PortalUserSummary, UserFilter, UserFormValues, ViewState } from '../types';
import { ResetPasswordResultModal } from './reset-password-result-modal';
import { UserFormModal } from './user-form-modal';

const ROLE_LABELS: Record<PortalUserSummary['role'], string> = {
  admin: 'Administrator',
  executive_council: 'Executive Council',
  troop_leader: 'Troop Leader',
};

function toDisplayDateTime(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export interface UsersPanelProps {
  viewState: ViewState;
  users: PortalUserSummary[];
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: UserFilter;
  onRoleFilterChange: (value: UserFilter) => void;
  currentUserId: string;
  onRetry: () => void;
  onCreate: (values: CreateUserFormValues) => Promise<void>;
  onUpdate: (id: string, values: UserFormValues) => Promise<void>;
  onToggleStatus: (id: string, nextIsActive: boolean) => Promise<void>;
  onResetPassword: (id: string) => Promise<string>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Admin CRUD + activate/deactivate + reset password + role assignment
 * (build-plan.md §3.4, project-overview.md's Administrator "User Management"
 * section). Every action here is Administrator-only — this panel only renders
 * behind `users:manage`, checked by `SettingsView`.
 */
export function UsersPanel({
  viewState,
  users,
  totalItems,
  page,
  pageSize,
  onPageChange,
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  currentUserId,
  onRetry,
  onCreate,
  onUpdate,
  onToggleStatus,
  onResetPassword,
  onDelete,
}: UsersPanelProps) {
  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; user: PortalUserSummary } | null>(null);
  const [statusTarget, setStatusTarget] = useState<PortalUserSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortalUserSummary | null>(null);
  const [resetTarget, setResetTarget] = useState<PortalUserSummary | null>(null);
  const [resetResult, setResetResult] = useState<{ userName: string; password: string } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const hasActiveFilters = search.length > 0 || roleFilter !== 'all';

  async function handleCreate(values: CreateUserFormValues) {
    await onCreate(values);
    setFormModal(null);
  }

  async function handleUpdate(values: CreateUserFormValues) {
    if (formModal?.mode !== 'edit') return;
    await onUpdate(formModal.user.id, values);
    setFormModal(null);
  }

  async function confirmToggleStatus() {
    if (!statusTarget) return;
    setIsConfirming(true);
    setConfirmError(null);
    try {
      await onToggleStatus(statusTarget.id, !statusTarget.isActive);
      setStatusTarget(null);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Could not update this account.');
    } finally {
      setIsConfirming(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsConfirming(true);
    setConfirmError(null);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Could not delete this user.');
    } finally {
      setIsConfirming(false);
    }
  }

  async function confirmReset() {
    if (!resetTarget) return;
    setIsConfirming(true);
    setConfirmError(null);
    try {
      const password = await onResetPassword(resetTarget.id);
      setResetResult({ userName: resetTarget.fullName, password });
      setResetTarget(null);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Could not reset this password.');
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Portal Users"
        subtitle={viewState === 'ready' ? `${totalItems.toLocaleString()} user${totalItems === 1 ? '' : 's'}` : undefined}
        actions={
          <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
            Add User
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2.5">
        <SearchInput
          label="Search users"
          placeholder="Search name or email…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onClear={() => onSearchChange('')}
          className="w-full sm:w-64"
        />
        <Select
          aria-label="Filter by role"
          className="w-full sm:w-48"
          options={USER_ROLE_FILTER_OPTIONS}
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value as UserFilter)}
        />
      </div>

      {viewState === 'loading' ? <TableSkeleton rows={5} columns={6} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={onRetry} description="We could not load portal users. Check your connection and try again." />
      ) : null}

      {viewState === 'ready' && users.length === 0 && !hasActiveFilters ? (
        <EmptyState
          icon={MembersIcon}
          title="No portal users yet"
          description="Add the first user account to grant portal access."
          action={
            <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
              Add User
            </Button>
          }
        />
      ) : null}

      {viewState === 'ready' && users.length === 0 && hasActiveFilters ? (
        <EmptyState
          icon={MembersIcon}
          title="No users match your filters"
          description="Try a different search term or clear the role filter."
          action={
            <Button
              variant="outline"
              onClick={() => {
                onSearchChange('');
                onRoleFilterChange('all');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : null}

      {viewState === 'ready' && users.length > 0 ? (
        <>
          <TableWrapper>
            <Table caption="Portal users">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>User</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Last Login</TableHeaderCell>
                  <TableHeaderCell>
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <TableAvatar name={user.fullName} />
                          <div>
                            <p className="font-semibold text-ink">{user.fullName}</p>
                            <p className="text-[0.78rem] text-muted">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge tone={ROLE_BADGE_TONES[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge tone={user.isActive ? 'green' : 'red'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{toDisplayDateTime(user.lastLoginAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="gray"
                            size="sm"
                            aria-label={`Edit ${user.fullName}`}
                            onClick={() => setFormModal({ mode: 'edit', user })}
                          >
                            <EditIcon aria-hidden />
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            aria-label={`Reset password for ${user.fullName}`}
                            onClick={() => setResetTarget(user)}
                          >
                            <PasswordIcon aria-hidden />
                          </Button>
                          <Button
                            variant={user.isActive ? 'red' : 'outline'}
                            size="sm"
                            aria-label={user.isActive ? `Deactivate ${user.fullName}` : `Activate ${user.fullName}`}
                            disabled={isSelf}
                            title={isSelf ? 'You cannot deactivate your own account.' : undefined}
                            onClick={() => setStatusTarget(user)}
                          >
                            {user.isActive ? <RejectIcon aria-hidden /> : <SuccessIcon aria-hidden />}
                          </Button>
                          <Button
                            variant="red"
                            size="sm"
                            aria-label={`Delete ${user.fullName}`}
                            disabled={isSelf}
                            title={isSelf ? 'You cannot delete your own account.' : undefined}
                            onClick={() => setDeleteTarget(user)}
                          >
                            <DeleteIcon aria-hidden />
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
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={onPageChange}
            itemLabel="users"
          />
        </>
      ) : null}

      <UserFormModal
        isOpen={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        initialValues={
          formModal?.mode === 'edit'
            ? {
                fullName: formModal.user.fullName,
                email: formModal.user.email,
                phoneNumber: formModal.user.phoneNumber ?? '',
                role: formModal.user.role,
              }
            : undefined
        }
        onClose={() => setFormModal(null)}
        onSubmit={formModal?.mode === 'edit' ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        isOpen={statusTarget !== null}
        tone={statusTarget?.isActive ? 'danger' : 'default'}
        title={statusTarget?.isActive ? 'Deactivate user?' : 'Activate user?'}
        isConfirming={isConfirming}
        description={
          confirmError ?? (
            <>
              <strong>{statusTarget?.fullName}</strong>{' '}
              {statusTarget?.isActive ? 'will lose portal access immediately.' : 'will regain portal access.'}
            </>
          )
        }
        confirmLabel={statusTarget?.isActive ? 'Deactivate' : 'Activate'}
        onConfirm={confirmToggleStatus}
        onCancel={() => {
          setStatusTarget(null);
          setConfirmError(null);
        }}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        tone="danger"
        title="Delete user?"
        isConfirming={isConfirming}
        description={
          confirmError ?? (
            <>
              <strong>{deleteTarget?.fullName}</strong> will be permanently removed. This cannot be undone.
            </>
          )
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setConfirmError(null);
        }}
      />

      <ConfirmDialog
        isOpen={resetTarget !== null}
        tone="warning"
        title="Reset password?"
        isConfirming={isConfirming}
        description={
          confirmError ?? (
            <>
              A new temporary password will be generated for <strong>{resetTarget?.fullName}</strong>. Their current
              password stops working immediately.
            </>
          )
        }
        confirmLabel="Reset Password"
        onConfirm={confirmReset}
        onCancel={() => {
          setResetTarget(null);
          setConfirmError(null);
        }}
      />

      <ResetPasswordResultModal
        isOpen={resetResult !== null}
        userName={resetResult?.userName ?? null}
        temporaryPassword={resetResult?.password ?? null}
        onClose={() => setResetResult(null)}
      />
    </Card>
  );
}
