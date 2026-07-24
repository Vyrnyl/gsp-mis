'use client';

import { useState } from 'react';

import { AddIcon, ConfigIcon, DeleteIcon, EditIcon } from '@/shared/components/icons';
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
import { formatCurrency } from '@/shared/utils/format-currency';

import type { FeeTypeFormValues, FeeTypeItem, ViewState } from '../types';
import { FeeTypeFormModal } from './fee-type-form-modal';

export interface FeeTypesPanelProps {
  viewState: ViewState;
  feeTypes: FeeTypeItem[];
  canManage: boolean;
  onRetry: () => void;
  onCreate: (values: FeeTypeFormValues) => Promise<void>;
  onUpdate: (id: string, values: FeeTypeFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function FeeTypesPanel({
  viewState,
  feeTypes,
  canManage,
  onRetry,
  onCreate,
  onUpdate,
  onDelete,
}: FeeTypesPanelProps) {
  const { showToast } = useToast();
  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; item: FeeTypeItem } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeeTypeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedFeeTypes = [...feeTypes].sort((a, b) => a.name.localeCompare(b.name));

  async function handleCreate(values: FeeTypeFormValues) {
    await onCreate(values);
    setFormModal(null);
    showToast(`${values.name} added.`, 'success');
  }

  async function handleUpdate(values: FeeTypeFormValues) {
    if (formModal?.mode !== 'edit') return;
    await onUpdate(formModal.item.id, values);
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
      showToast(err instanceof Error ? err.message : 'Could not delete this fee type.', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Fee Types"
        subtitle={viewState === 'ready' ? `${feeTypes.length} fee type${feeTypes.length === 1 ? '' : 's'}` : undefined}
        actions={
          canManage ? (
            <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setFormModal({ mode: 'create' })}>
              Add Fee Type
            </Button>
          ) : undefined
        }
      />

      {viewState === 'loading' ? <TableSkeleton rows={3} columns={4} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={onRetry} description="We could not load fee types. Check your connection and try again." />
      ) : null}

      {viewState === 'ready' && sortedFeeTypes.length === 0 ? (
        <EmptyState
          icon={ConfigIcon}
          title="No fee types yet"
          description="Add the first fee type to make it available when recording payments."
          action={
            canManage ? (
              <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setFormModal({ mode: 'create' })}>
                Add Fee Type
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {viewState === 'ready' && sortedFeeTypes.length > 0 ? (
        <TableWrapper>
          <Table caption="Fee types">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Payments</TableHeaderCell>
                {canManage ? (
                  <TableHeaderCell>
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                ) : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedFeeTypes.map((feeType) => (
                <TableRow key={feeType.id}>
                  <TableCell className="font-semibold text-ink">{feeType.name}</TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap">{formatCurrency(feeType.amount)}</span>
                  </TableCell>
                  <TableCell>{feeType.description ?? <span className="text-muted">—</span>}</TableCell>
                  <TableCell>{feeType.paymentCount}</TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="gray"
                          size="sm"
                          aria-label={`Edit ${feeType.name}`}
                          onClick={() => setFormModal({ mode: 'edit', item: feeType })}
                        >
                          <EditIcon aria-hidden />
                        </Button>
                        <Button
                          variant="red"
                          size="sm"
                          aria-label={`Delete ${feeType.name}`}
                          disabled={feeType.paymentCount > 0}
                          title={feeType.paymentCount > 0 ? 'Remove all payments using this fee type first.' : undefined}
                          onClick={() => setDeleteTarget(feeType)}
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

      <FeeTypeFormModal
        isOpen={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        initialValues={
          formModal?.mode === 'edit'
            ? {
                name: formModal.item.name,
                amount: formModal.item.amount,
                description: formModal.item.description ?? '',
              }
            : undefined
        }
        onClose={() => setFormModal(null)}
        onSubmit={formModal?.mode === 'edit' ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        tone="danger"
        title="Delete fee type?"
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
