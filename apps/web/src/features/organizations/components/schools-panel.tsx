'use client';

import { useMemo, useState } from 'react';

import { AddIcon, DeleteIcon, EditIcon, SchoolIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Pagination,
  Select,
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

import { ALL_MUNICIPALITIES, EMPTY_SCHOOL_FORM_VALUES, UNASSIGNED_MUNICIPALITY } from '../constants';
import type { Council, Municipality, School, SchoolFormValues, ViewState } from '../types';
import { SchoolFormModal } from './school-form-modal';

const PAGE_SIZE = 8;

export interface SchoolsPanelProps {
  viewState: ViewState;
  schools: School[];
  councils: Council[];
  municipalities: Municipality[];
  /** A municipality id, `ALL_MUNICIPALITIES` or `UNASSIGNED_MUNICIPALITY`. Held by the parent
   * so the Municipalities tab can open this one narrowed to a municipality. */
  municipalityFilter: string;
  onMunicipalityFilterChange: (value: string) => void;
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
  municipalities,
  municipalityFilter,
  onMunicipalityFilterChange,
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

  const visibleSchools = useMemo(() => {
    if (municipalityFilter === ALL_MUNICIPALITIES) return schools;
    if (municipalityFilter === UNASSIGNED_MUNICIPALITY) {
      return schools.filter((school) => !school.municipalityId);
    }
    return schools.filter((school) => school.municipalityId === municipalityFilter);
  }, [schools, municipalityFilter]);
  const { page, setPage, pageItems, totalItems, pageSize } = usePagedItems(visibleSchools, PAGE_SIZE);

  const filterOptions = [
    { value: ALL_MUNICIPALITIES, label: 'All municipalities' },
    { value: UNASSIGNED_MUNICIPALITY, label: 'Not assigned' },
    ...municipalities.map((municipality) => ({ value: municipality.id, label: municipality.name })),
  ];

  /** Adding from a narrowed list starts in that municipality. */
  const filteredMunicipality = municipalities.find((municipality) => municipality.id === municipalityFilter);
  const createDefaults: SchoolFormValues = filteredMunicipality
    ? {
        ...EMPTY_SCHOOL_FORM_VALUES,
        councilId: filteredMunicipality.councilId,
        municipalityId: filteredMunicipality.id,
      }
    : EMPTY_SCHOOL_FORM_VALUES;

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
        subtitle={
          viewState === 'ready' ? `${visibleSchools.length} school${visibleSchools.length === 1 ? '' : 's'}` : undefined
        }
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

      {schools.length > 0 ? (
        <div className="mb-4 w-full sm:w-64">
          <Select
            aria-label="Filter schools by municipality"
            options={filterOptions}
            value={municipalityFilter}
            onChange={(event) => onMunicipalityFilterChange(event.target.value)}
          />
        </div>
      ) : null}

      {viewState === 'loading' ? <TableSkeleton rows={4} columns={5} /> : null}

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

      {viewState === 'ready' && schools.length > 0 && visibleSchools.length === 0 ? (
        <EmptyState
          icon={SchoolIcon}
          title="No schools here yet"
          description="No school is assigned to this municipality. Edit a school to assign it, or add a new one."
        />
      ) : null}

      {viewState === 'ready' && visibleSchools.length > 0 ? (
        <TableWrapper>
          <Table caption="Schools">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Municipality</TableHeaderCell>
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
                  <TableCell>{school.municipalityName ?? <span className="text-muted">Not assigned</span>}</TableCell>
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

      {viewState === 'ready' && visibleSchools.length > pageSize ? (
        <Pagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} itemLabel="schools" />
      ) : null}

      <SchoolFormModal
        isOpen={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        initialValues={
          formModal?.mode === 'edit'
            ? {
                name: formModal.school.name,
                councilId: formModal.school.councilId,
                municipalityId: formModal.school.municipalityId ?? '',
              }
            : createDefaults
        }
        councils={councils}
        municipalities={municipalities}
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
