'use client';

import type { ReactNode } from 'react';

import type { IconType } from '@/shared/components/icons';
import { cn } from '@/shared/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: IconType;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Accessible tab list — registry §9. Generalizes the `role="tablist"` pattern
 * auth-card.tsx hardcoded for its two tabs. Scrolls horizontally instead of
 * wrapping below `md` so five-plus tabs stay usable at 480px.
 *
 * Assumes one `Tabs` instance per page — ids are derived from `item.id` alone,
 * not namespaced, so the consumer's tabpanel `id`/`aria-labelledby` must use the
 * same `${id}-tab` / `${id}-panel` convention.
 */
export function Tabs({ items, activeId, onChange, ariaLabel, className }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex gap-1 overflow-x-auto border-b-2 border-hairline-subtle', className)}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${item.id}-tab`}
            aria-selected={isActive}
            aria-controls={`${item.id}-panel`}
            onClick={() => onChange(item.id)}
            className={cn(
              '-mb-0.5 flex shrink-0 items-center gap-2 border-b-[3px] px-4 py-3 text-[0.9rem] font-semibold transition',
              isActive
                ? 'border-brand-green text-brand-green'
                : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {Icon ? <Icon className="text-[1.05rem]" aria-hidden /> : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps {
  id: string;
  children: ReactNode;
}

/** Pairs with `Tabs` via the shared `${id}-tab` / `${id}-panel` id convention. */
export function TabPanel({ id, children }: TabPanelProps) {
  return (
    <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab`} className="pt-5">
      {children}
    </div>
  );
}
