'use client';

import { useState } from 'react';

import { AddIcon, CouncilIcon, DeleteIcon, EditIcon } from '@/shared/components/icons';
import {
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

import type { Council, CouncilFormValues, ViewState } from '../types';
import { CouncilFormModal } from './council-form-modal';

export interface CouncilsPanelProps {
  viewState: ViewState;
  councils: Council[];
  canManage: boolean;
  onRetry: () => void;
  onCreate: (values: CouncilFormValues) => Promise<void>;
  onUpdate: (id: string, values: CouncilFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CouncilsPanel({
  viewState,
  councils,
  canManage,
  onRetry,
  onCreate,
  onUpdate,
  onDelete,
}: CouncilsPanelProps) {
  const { showToast } = useToast();
  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; council: Council } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Council | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCreate(values: CouncilFormValues) {
    await onCreate(values);
    setFormModal(null);
    showToast(`${values.name} added.`, 'success');
  }

  async function handleUpdate(values: CouncilFormValues) {
    if (formModal?.mode !== 'edit') return;
    await onUpdate(formModal.council.id, values);
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
      showToast(err instanceof Error ? err.message : 'Could not delete this council.', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        as="h2"
        title="Councils"
        subtitle={viewState === 'ready' ? `${councils.length} council${councils.length === 1 ? '' : 's'}` : undefined}
        actions={
          canManage ? (
            <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
              Add Council
            </Button>
          ) : undefined
        }
      />

      {viewState === 'loading' ? <TableSkeleton rows={3} columns={5} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={onRetry} description="We could not load the councils list. Check your connection and try again." />
      ) : null}

      {viewState === 'ready' && councils.length === 0 ? (
        <EmptyState
          icon={CouncilIcon}
          title="No councils yet"
          description="Add the first council to start building the organization hierarchy."
          action={
            canManage ? (
              <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
                Add Council
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {viewState === 'ready' && councils.length > 0 ? (
        <TableWrapper>
          <Table caption="Councils">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Troops</TableHeaderCell>
                <TableHeaderCell>Members</TableHeaderCell>
                {canManage ? (
                  <TableHeaderCell>
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                ) : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {councils.map((council) => (
                <TableRow key={council.id}>
                  <TableCell className="font-semibold text-ink">{council.name}</TableCell>
                  <TableCell>{council.description ?? <span className="text-muted">—</span>}</TableCell>
                  <TableCell>{council.troopCount}</TableCell>
                  <TableCell>{council.memberCount}</TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="gray"
                          size="sm"
                          aria-label={`Edit ${council.name}`}
                          onClick={() => setFormModal({ mode: 'edit', council })}
                        >
                          <EditIcon aria-hidden />
                        </Button>
                        <Button
                          variant="red"
                          size="sm"
                          aria-label={`Delete ${council.name}`}
                          disabled={council.troopCount > 0}
                          title={council.troopCount > 0 ? 'Reassign this council’s troops before deleting it.' : undefined}
                          onClick={() => setDeleteTarget(council)}
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

      <CouncilFormModal
        isOpen={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        initialValues={formModal?.mode === 'edit' ? { name: formModal.council.name, description: formModal.council.description ?? '' } : undefined}
        onClose={() => setFormModal(null)}
        onSubmit={formModal?.mode === 'edit' ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        tone="danger"
        title="Delete council?"
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
