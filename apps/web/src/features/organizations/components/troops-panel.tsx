'use client';

import { useState } from 'react';

import { AddIcon, DeleteIcon, EditIcon, TroopLeaderIcon } from '@/shared/components/icons';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
  useToast,
} from '@/shared/components/ui';

import type { Council, Troop, TroopFormValues, TroopLeaderOption, ViewState } from '../types';
import { TroopFormModal } from './troop-form-modal';

export interface TroopsPanelProps {
  viewState: ViewState;
  troops: Troop[];
  councils: Council[];
  leaderOptions: TroopLeaderOption[];
  canManage: boolean;
  onRetry: () => void;
  onCreate: (values: TroopFormValues) => Promise<void>;
  onUpdate: (id: string, values: TroopFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TroopsPanel({
  viewState,
  troops,
  councils,
  leaderOptions,
  canManage,
  onRetry,
  onCreate,
  onUpdate,
  onDelete,
}: TroopsPanelProps) {
  const { showToast } = useToast();
  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; troop: Troop } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Troop | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCreate(values: TroopFormValues) {
    await onCreate(values);
    setFormModal(null);
    showToast(`${values.name} added.`, 'success');
  }

  async function handleUpdate(values: TroopFormValues) {
    if (formModal?.mode !== 'edit') return;
    await onUpdate(formModal.troop.id, values);
    setFormModal(null);
    showToast(`${values.name} updated.`, 'success');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      showToast(`${deleteTarget.name} deleted.`, 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete this troop.', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        as="h2"
        title="Troops"
        subtitle={viewState === 'ready' ? `${troops.length} troop${troops.length === 1 ? '' : 's'}` : undefined}
        actions={
          canManage ? (
            <Button
              leadingIcon={<AddIcon />}
              onClick={() => setFormModal({ mode: 'create' })}
              disabled={councils.length === 0}
              title={councils.length === 0 ? 'Add a council first.' : undefined}
            >
              Add Troop
            </Button>
          ) : undefined
        }
      />

      {viewState === 'loading' ? <TableSkeleton rows={4} columns={6} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={onRetry} description="We could not load the troops list. Check your connection and try again." />
      ) : null}

      {viewState === 'ready' && troops.length === 0 ? (
        <EmptyState
          icon={TroopLeaderIcon}
          title="No troops yet"
          description="Add the first troop under a council to start assigning members and leaders."
          action={
            canManage && councils.length > 0 ? (
              <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
                Add Troop
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {viewState === 'ready' && troops.length > 0 ? (
        <TableWrapper>
          <Table caption="Troops">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Troop Code</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Council</TableHeaderCell>
                <TableHeaderCell>Leader</TableHeaderCell>
                <TableHeaderCell>Members</TableHeaderCell>
                {canManage ? (
                  <TableHeaderCell>
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                ) : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {troops.map((troop) => (
                <TableRow key={troop.id}>
                  <TableCell>
                    <code className="whitespace-nowrap rounded bg-subtle px-1.5 py-0.5 text-[0.8rem]">
                      {troop.troopCode}
                    </code>
                  </TableCell>
                  <TableCell className="font-semibold text-ink">{troop.name}</TableCell>
                  <TableCell>{troop.councilName}</TableCell>
                  <TableCell>
                    {troop.leaderName ? troop.leaderName : <Badge tone="gray">No Leader</Badge>}
                  </TableCell>
                  <TableCell>{troop.memberCount}</TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="gray"
                          size="sm"
                          aria-label={`Edit ${troop.name}`}
                          onClick={() =>
                            setFormModal({
                              mode: 'edit',
                              troop,
                            })
                          }
                        >
                          <EditIcon aria-hidden />
                        </Button>
                        <Button
                          variant="red"
                          size="sm"
                          aria-label={`Delete ${troop.name}`}
                          disabled={troop.memberCount > 0}
                          title={troop.memberCount > 0 ? 'Reassign this troop’s members before deleting it.' : undefined}
                          onClick={() => setDeleteTarget(troop)}
                        >
                          <DeleteIcon aria-hidden />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      ) : null}

      <TroopFormModal
        isOpen={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        initialValues={
          formModal?.mode === 'edit'
            ? {
                troopCode: formModal.troop.troopCode,
                name: formModal.troop.name,
                councilId: formModal.troop.councilId,
                leaderId: formModal.troop.leaderId ?? '',
              }
            : undefined
        }
        councils={councils}
        leaderOptions={leaderOptions}
        onClose={() => setFormModal(null)}
        onSubmit={formModal?.mode === 'edit' ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        tone="danger"
        title="Delete troop?"
        isConfirming={isDeleting}
        description={
          <>
            <strong>{deleteTarget?.name}</strong> will be permanently removed. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}
