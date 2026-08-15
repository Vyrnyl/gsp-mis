'use client';

import { useState } from 'react';

import { AddIcon, DeleteIcon, EditIcon, SchoolIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Pagination,
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
import { usePagedItems } from '@/shared/hooks/use-paged-items';

import type { Council, School, SchoolFormValues, ViewState } from '../types';
import { SchoolFormModal } from './school-form-modal';

const PAGE_SIZE = 8;

export interface SchoolsPanelProps {
  viewState: ViewState;
  schools: School[];
  councils: Council[];
  canManage: boolean;
  onRetry: () => void;
  onCreate: (values: SchoolFormValues) => Promise<void>;
  onUpdate: (id: string, values: SchoolFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function SchoolsPanel({
  viewState,
  schools,
  councils,
  canManage,
  onRetry,
  onCreate,
  onUpdate,
  onDelete,
}: SchoolsPanelProps) {
  const { showToast } = useToast();
  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; school: School } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<School | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { page, setPage, pageItems, totalItems, pageSize } = usePagedItems(schools, PAGE_SIZE);

  async function handleCreate(values: SchoolFormValues) {
    await onCreate(values);
    setFormModal(null);
    showToast(`${values.name} added.`, 'success');
  }

  async function handleUpdate(values: SchoolFormValues) {
    if (formModal?.mode !== 'edit') return;
    await onUpdate(formModal.school.id, values);
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
      showToast(err instanceof Error ? err.message : 'Could not delete this school.', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        as="h2"
        title="Schools"
        subtitle={viewState === 'ready' ? `${schools.length} school${schools.length === 1 ? '' : 's'}` : undefined}
        actions={
          canManage ? (
            <Button
              leadingIcon={<AddIcon />}
              onClick={() => setFormModal({ mode: 'create' })}
              disabled={councils.length === 0}
              title={councils.length === 0 ? 'Add a council first.' : undefined}
            >
              Add School
            </Button>
          ) : undefined
        }
      />

      {viewState === 'loading' ? <TableSkeleton rows={4} columns={4} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={onRetry} description="We could not load the schools list. Check your connection and try again." />
      ) : null}

      {viewState === 'ready' && schools.length === 0 ? (
        <EmptyState
          icon={SchoolIcon}
          title="No schools yet"
          description="Add a sponsoring school so members can be linked to it during registration."
          action={
            canManage && councils.length > 0 ? (
              <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
                Add School
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {viewState === 'ready' && schools.length > 0 ? (
        <TableWrapper>
          <Table caption="Schools">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Council</TableHeaderCell>
                <TableHeaderCell>Members</TableHeaderCell>
                {canManage ? (
                  <TableHeaderCell>
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                ) : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-semibold text-ink">{school.name}</TableCell>
                  <TableCell>{school.councilName}</TableCell>
                  <TableCell>{school.memberCount}</TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="gray"
                          size="sm"
                          aria-label={`Edit ${school.name}`}
                          onClick={() => setFormModal({ mode: 'edit', school })}
                        >
                          <EditIcon aria-hidden />
                        </Button>
                        <Button
                          variant="red"
                          size="sm"
                          aria-label={`Delete ${school.name}`}
                          disabled={school.memberCount > 0}
                          title={school.memberCount > 0 ? 'Reassign members using this school before deleting it.' : undefined}
                          onClick={() => setDeleteTarget(school)}
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

      {viewState === 'ready' && schools.length > pageSize ? (
        <Pagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} itemLabel="schools" />
      ) : null}

      <SchoolFormModal
        isOpen={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        initialValues={
          formModal?.mode === 'edit'
            ? { name: formModal.school.name, councilId: formModal.school.councilId }
            : undefined
        }
        councils={councils}
        onClose={() => setFormModal(null)}
        onSubmit={formModal?.mode === 'edit' ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        tone="danger"
        title="Delete school?"
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
