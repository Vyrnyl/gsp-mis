'use client';

import { useState } from 'react';

import { AddIcon, DeleteIcon, EditIcon, EyeIcon, LocationIcon } from '@/shared/components/icons';
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

import type { Council, Municipality, MunicipalityFormValues, ViewState } from '../types';
import { MunicipalityFormModal } from './municipality-form-modal';

const PAGE_SIZE = 8;

export interface MunicipalitiesPanelProps {
  viewState: ViewState;
  municipalities: Municipality[];
  councils: Council[];
  canManage: boolean;
  onRetry: () => void;
  onCreate: (values: MunicipalityFormValues) => Promise<void>;
  onUpdate: (id: string, values: MunicipalityFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  /** Opens the Schools tab narrowed to this municipality. */
  onViewSchools: (municipalityId: string) => void;
}

export function MunicipalitiesPanel({
  viewState,
  municipalities,
  councils,
  canManage,
  onRetry,
  onCreate,
  onUpdate,
  onDelete,
  onViewSchools,
}: MunicipalitiesPanelProps) {
  const { showToast } = useToast();
  const [formModal, setFormModal] = useState<
    { mode: 'create' } | { mode: 'edit'; municipality: Municipality } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Municipality | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { page, setPage, pageItems, totalItems, pageSize } = usePagedItems(
    municipalities,
    PAGE_SIZE,
  );

  async function handleCreate(values: MunicipalityFormValues) {
    await onCreate(values);
    setFormModal(null);
    showToast(`${values.name} added.`, 'success');
  }

  async function handleUpdate(values: MunicipalityFormValues) {
    if (formModal?.mode !== 'edit') return;
    await onUpdate(formModal.municipality.id, values);
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
      showToast(
        err instanceof Error ? err.message : 'Could not delete this municipality.',
        'error',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        as="h2"
        title="Municipalities"
        subtitle={
          viewState === 'ready'
            ? `${municipalities.length} municipalit${municipalities.length === 1 ? 'y' : 'ies'}`
            : undefined
        }
        actions={
          canManage ? (
            <Button
              leadingIcon={<AddIcon />}
              onClick={() => setFormModal({ mode: 'create' })}
              disabled={councils.length === 0}
              title={councils.length === 0 ? 'Add a council first.' : undefined}
            >
              Add Municipality
            </Button>
          ) : undefined
        }
      />

      {viewState === 'loading' ? <TableSkeleton rows={4} columns={4} /> : null}

      {viewState === 'error' ? (
        <ErrorState
          onRetry={onRetry}
          description="We could not load the municipalities list. Check your connection and try again."
        />
      ) : null}

      {viewState === 'ready' && municipalities.length === 0 ? (
        <EmptyState
          icon={LocationIcon}
          title="No municipalities yet"
          description="Add a municipality so schools can be grouped under it."
          action={
            canManage && councils.length > 0 ? (
              <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
                Add Municipality
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {viewState === 'ready' && municipalities.length > 0 ? (
        <TableWrapper>
          <Table caption="Municipalities">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Council</TableHeaderCell>
                <TableHeaderCell>Schools</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">Actions</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((municipality) => (
                <TableRow key={municipality.id}>
                  <TableCell className="font-semibold text-ink">{municipality.name}</TableCell>
                  <TableCell>{municipality.councilName}</TableCell>
                  <TableCell>{municipality.schoolCount}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        leadingIcon={<EyeIcon aria-hidden />}
                        aria-label={`View schools in ${municipality.name}`}
                        onClick={() => onViewSchools(municipality.id)}
                      >
                        Schools
                      </Button>
                      {canManage ? (
                        <>
                          <Button
                            variant="gray"
                            size="sm"
                            aria-label={`Edit ${municipality.name}`}
                            onClick={() => setFormModal({ mode: 'edit', municipality })}
                          >
                            <EditIcon aria-hidden />
                          </Button>
                          <Button
                            variant="red"
                            size="sm"
                            aria-label={`Delete ${municipality.name}`}
                            disabled={municipality.schoolCount > 0}
                            title={
                              municipality.schoolCount > 0
                                ? 'Reassign the schools in this municipality before deleting it.'
                                : undefined
                            }
                            onClick={() => setDeleteTarget(municipality)}
                          >
                            <DeleteIcon aria-hidden />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      ) : null}

      {viewState === 'ready' && municipalities.length > pageSize ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          itemLabel="municipalities"
        />
      ) : null}

      <MunicipalityFormModal
        isOpen={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        initialValues={
          formModal?.mode === 'edit'
            ? { name: formModal.municipality.name, councilId: formModal.municipality.councilId }
            : undefined
        }
        councils={councils}
        onClose={() => setFormModal(null)}
        onSubmit={formModal?.mode === 'edit' ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        tone="danger"
        title="Delete municipality?"
        isConfirming={isDeleting}
        description={
          <>
            <strong>{deleteTarget?.name}</strong> will be permanently removed. This cannot be
            undone.
          </>
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}
