'use client';

import { useState } from 'react';

import {
  AddIcon,
  DeleteIcon,
  EditIcon,
  resolveBadgeCategoryIcon,
  type IconType,
} from '@/shared/components/icons';
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

import type { CategoryFormValues, CategoryItem, ViewState } from '../types';
import { CategoryFormModal } from './category-form-modal';

export interface CategoryPanelProps {
  viewState: ViewState;
  title: string;
  itemNoun: string;
  itemNounPlural: string;
  icon: IconType;
  items: CategoryItem[];
  showOrder: boolean;
  /** Badge categories only — adds the icon swatch column and the form's icon picker. */
  showIcon?: boolean;
  usageLabel: string;
  canManage: boolean;
  onRetry: () => void;
  onCreate: (values: CategoryFormValues) => Promise<void>;
  onUpdate: (id: string, values: CategoryFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Shared table for the three lookup-table screens — Scout Levels, Badge Categories,
 * Activity Categories — which differ only in whether `orderNumber` applies and what
 * their usage count means (members / badges / events). Councils and Troops have
 * relational fields that don't fit this shape, so they get their own panels.
 */
export function CategoryPanel({
  viewState,
  title,
  itemNoun,
  itemNounPlural,
  icon: Icon,
  items,
  showOrder,
  showIcon = false,
  usageLabel,
  canManage,
  onRetry,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryPanelProps) {
  const { showToast } = useToast();
  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; item: CategoryItem } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedItems = showOrder
    ? [...items].sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
    : [...items].sort((a, b) => a.name.localeCompare(b.name));

  async function handleCreate(values: CategoryFormValues) {
    await onCreate(values);
    setFormModal(null);
    showToast(`${values.name} added.`, 'success');
  }

  async function handleUpdate(values: CategoryFormValues) {
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
      showToast(err instanceof Error ? err.message : `Could not delete this ${itemNoun.toLowerCase()}.`, 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        as="h2"
        title={title}
        subtitle={viewState === 'ready' ? `${items.length} ${items.length === 1 ? itemNoun.toLowerCase() : itemNounPlural.toLowerCase()}` : undefined}
        actions={
          canManage ? (
            <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
              Add {itemNoun}
            </Button>
          ) : undefined
        }
      />

      {viewState === 'loading' ? <TableSkeleton rows={showOrder ? 5 : 4} columns={showOrder ? 5 : 4} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={onRetry} description={`We could not load ${title.toLowerCase()}. Check your connection and try again.`} />
      ) : null}

      {viewState === 'ready' && sortedItems.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={`No ${title.toLowerCase()} yet`}
          description={`Add the first ${itemNoun.toLowerCase()} to make it available across the app.`}
          action={
            canManage ? (
              <Button leadingIcon={<AddIcon />} onClick={() => setFormModal({ mode: 'create' })}>
                Add {itemNoun}
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {viewState === 'ready' && sortedItems.length > 0 ? (
        <TableWrapper>
          <Table caption={title}>
            <TableHead>
              <TableRow>
                {showOrder ? <TableHeaderCell>Order</TableHeaderCell> : null}
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>{usageLabel}</TableHeaderCell>
                {canManage ? (
                  <TableHeaderCell>
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                ) : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedItems.map((item) => {
                const CategoryIcon = resolveBadgeCategoryIcon(item.icon);

                return (
                <TableRow key={item.id}>
                  {showOrder ? <TableCell>{item.orderNumber}</TableCell> : null}
                  <TableCell className="font-semibold text-ink">
                    {showIcon ? (
                      <span className="flex items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-green3 text-brand-green">
                          <CategoryIcon className="text-[0.95rem]" aria-hidden />
                        </span>
                        {item.name}
                      </span>
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell>{item.description ?? <span className="text-muted">—</span>}</TableCell>
                  <TableCell>{item.usageCount}</TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="gray"
                          size="sm"
                          aria-label={`Edit ${item.name}`}
                          onClick={() => setFormModal({ mode: 'edit', item })}
                        >
                          <EditIcon aria-hidden />
                        </Button>
                        <Button
                          variant="red"
                          size="sm"
                          aria-label={`Delete ${item.name}`}
                          disabled={item.usageCount > 0}
                          title={item.usageCount > 0 ? `Remove all ${usageLabel.toLowerCase()} using this first.` : undefined}
                          onClick={() => setDeleteTarget(item)}
                        >
                          <DeleteIcon aria-hidden />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrapper>
      ) : null}

      <CategoryFormModal
        isOpen={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        itemNoun={itemNoun}
        showOrder={showOrder}
        showIcon={showIcon}
        initialValues={
          formModal?.mode === 'edit'
            ? {
                name: formModal.item.name,
                description: formModal.item.description ?? '',
                orderNumber: formModal.item.orderNumber,
                icon: formModal.item.icon,
              }
            : undefined
        }
        onClose={() => setFormModal(null)}
        onSubmit={formModal?.mode === 'edit' ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        tone="danger"
        title={`Delete ${itemNoun.toLowerCase()}?`}
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
