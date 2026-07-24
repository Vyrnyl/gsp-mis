'use client';

import { useState } from 'react';

import { AddIcon, BadgeIcon, DeleteIcon, EditIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  ErrorState,
} from '@/shared/components/ui';

import type { BadgeCatalogItem, BadgeCategoryOption, BadgeFormValues, ViewState } from '../types';
import { BadgeFormModal } from './badge-form-modal';

export interface BadgeCatalogPanelProps {
  viewState: ViewState;
  badges: BadgeCatalogItem[];
  categoryOptions: BadgeCategoryOption[];
  canManage: boolean;
  onRetry: () => void;
  onCreate: (values: BadgeFormValues) => Promise<void>;
  onUpdate: (badgeId: string, values: BadgeFormValues) => Promise<void>;
  onDelete: (badgeId: string) => Promise<void>;
}

/**
 * Badge catalog grid — registry §3 `.badge-grid`/`.badge-card`. Unlike the prototype,
 * card state is neutral catalog info (not a per-viewer `.earned` toggle) — "earned" is
 * a per-member fact that belongs on the Member Progress tab, not the shared catalog.
 */
export function BadgeCatalogPanel({
  viewState,
  badges,
  categoryOptions,
  canManage,
  onRetry,
  onCreate,
  onUpdate,
  onDelete,
}: BadgeCatalogPanelProps) {
  const [formState, setFormState] = useState<{ mode: 'create' | 'edit'; badge?: BadgeCatalogItem } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BadgeCatalogItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleFormSubmit(values: BadgeFormValues) {
    if (formState?.mode === 'edit' && formState.badge) {
      await onUpdate(formState.badge.id, values);
    } else {
      await onCreate(values);
    }
    setFormState(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Badge Catalog"
        subtitle={viewState === 'ready' ? `${badges.length.toLocaleString()} badges` : undefined}
        actions={
          canManage ? (
            <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setFormState({ mode: 'create' })}>
              Add Badge
            </Button>
          ) : undefined
        }
      />

      {viewState === 'loading' ? <CardSkeleton lines={4} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={onRetry} description="We could not load the badge catalog. Check your connection and try again." />
      ) : null}

      {viewState === 'ready' && badges.length === 0 ? (
        <EmptyState
          icon={BadgeIcon}
          title="No badges in the catalog yet"
          description={
            canManage
              ? 'Add the first badge so troop leaders can start recording earned badges.'
              : 'The administrator has not added any badges yet.'
          }
          action={
            canManage ? (
              <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setFormState({ mode: 'create' })}>
                Add Badge
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {viewState === 'ready' && badges.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 lg2:grid-cols-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="rounded-card border-2 border-hairline-subtle bg-surface p-3.5 text-center transition hover:-translate-y-0.5 hover:border-brand-green"
            >
              <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-status-warning-bg text-brand-gold-ink">
                <BadgeIcon className="text-xl" aria-hidden />
              </span>
              <p className="mt-2 text-[0.82rem] font-semibold text-ink">{badge.name}</p>
              <p className="mt-0.5 text-[0.72rem] text-muted">{badge.categoryName ?? 'Uncategorized'}</p>
              <p className="mt-0.5 text-[0.72rem] text-muted">{badge.requiredPoints} pts</p>
              <p className="mt-1 text-[0.72rem] text-muted">
                {badge.earnedCount} member{badge.earnedCount === 1 ? '' : 's'} earned
              </p>
              {canManage ? (
                <div className="mt-2.5 flex justify-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Edit ${badge.name}`}
                    onClick={() => setFormState({ mode: 'edit', badge })}
                  >
                    <EditIcon aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Delete ${badge.name}`}
                    onClick={() => setDeleteTarget(badge)}
                  >
                    <DeleteIcon aria-hidden />
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {canManage ? (
        <BadgeFormModal
          isOpen={formState !== null}
          mode={formState?.mode ?? 'create'}
          categoryOptions={categoryOptions}
          initialValues={
            formState?.badge
              ? {
                  name: formState.badge.name,
                  description: formState.badge.description ?? '',
                  categoryId: formState.badge.categoryId ?? '',
                  requiredPoints: formState.badge.requiredPoints,
                  requirements: formState.badge.requirements.length > 0 ? formState.badge.requirements : [''],
                }
              : undefined
          }
          onClose={() => setFormState(null)}
          onSubmit={handleFormSubmit}
        />
      ) : null}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete this badge?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed from the catalog, along with every member's progress toward it.`
            : ''
        }
        tone="danger"
        confirmLabel="Delete Badge"
        isConfirming={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}
