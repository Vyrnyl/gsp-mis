'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { CheckIcon, ChevronDownIcon, SearchIcon } from '@/shared/components/icons';
import { useFieldContext } from '@/shared/components/ui/form-field';
import { CONTROL_CLASSES, CONTROL_ERROR_CLASSES } from '@/shared/components/ui/input';
import type { SelectOption } from '@/shared/components/ui/select';
import { cn } from '@/shared/utils/cn';

/** ~7 rows. The cap only shrinks from here, never grows past it. */
const DEFAULT_LIST_MAX_HEIGHT = 280;
/** Below this the popup is too short to be worth showing downward; flip it above instead. */
const MIN_LIST_MAX_HEIGHT = 140;

export interface ComboboxProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Shown in the closed control when nothing is selected. */
  placeholder?: string;
  /** Shown inside the filter box. Defaults to a generic prompt. */
  searchPlaceholder?: string;
  /** Rendered when the filter matches nothing — an empty list with no explanation reads as a bug. */
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

/**
 * Searchable single-select — registry §9.
 *
 * Exists because a native `<select>`'s popup is drawn by the OS, outside the DOM:
 * `max-height`/`overflow-y` cannot reach it (the browser forces `overflow-y: clip`),
 * so a long list can be neither capped nor styled. Native popups do scroll on their
 * own, so this component is not about scrolling — it is about *finding*, which
 * scrolling a few hundred members does not solve. The capped, genuinely scrollable
 * list here is a consequence of owning the popup, not the reason for owning it.
 *
 * `Select` remains correct for short, fixed lists (statuses, roles, months) and is
 * still the default: it gets the OS picker on mobile for free. Reach for this only
 * when the options come from the database and grow with the organization.
 *
 * Keyboard contract: ArrowDown/ArrowUp move the active option, Enter selects it,
 * Escape closes without changing the value, Tab closes and moves on. Typing filters.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Type to filter…',
  emptyMessage = 'No matches.',
  disabled = false,
  id,
  name,
  className,
}: ComboboxProps) {
  const field = useFieldContext();
  const generatedId = useId();
  const controlId = id ?? field?.inputId ?? generatedId;
  const listboxId = `${controlId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [listMaxHeight, setListMaxHeight] = useState(DEFAULT_LIST_MAX_HEIGHT);
  const [dropUp, setDropUp] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((option) => option.value === value) ?? null;

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter((option) => option.label.toLowerCase().includes(trimmed));
  }, [options, query]);

  // Opening resets the filter, so a stale query can never hide the list you just opened.
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    const selectedIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    searchRef.current?.focus();
  }, [isOpen, options, value]);

  // Filtering can shorten the list past the active index — clamp rather than
  // leaving `aria-activedescendant` pointing at an option that no longer exists.
  useEffect(() => {
    setActiveIndex((current) => (current >= filtered.length ? 0 : current));
  }, [filtered.length]);

  /**
   * Fit the popup to the space that actually exists, not to a fixed 280px.
   *
   * The bound is the nearest scrolling ancestor, not just the viewport: inside a
   * `Modal` (`max-h-[90vh] overflow-y-auto`) an absolutely-positioned popup is
   * clipped by the modal's own scroll box, which on a short viewport sliced the
   * last rows off with no visible end to the list. Measured, not assumed.
   */
  useEffect(() => {
    if (!isOpen) return;

    function fit() {
      const trigger = buttonRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      let bottomBound = window.innerHeight;
      let topBound = 0;

      for (let el = trigger.parentElement; el && el !== document.body; el = el.parentElement) {
        const overflowY = getComputedStyle(el).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden') {
          const box = el.getBoundingClientRect();
          bottomBound = Math.min(bottomBound, box.bottom);
          topBound = Math.max(topBound, box.top);
          break;
        }
      }

      // `GUTTER` keeps the popup off the exact edge; `SEARCH_ROW` is the filter box,
      // which sits above the list and so eats into the same budget.
      const GUTTER = 12;
      const SEARCH_ROW = 46;
      const below = bottomBound - rect.bottom - GUTTER - SEARCH_ROW;
      const above = rect.top - topBound - GUTTER - SEARCH_ROW;

      const shouldDropUp = below < MIN_LIST_MAX_HEIGHT && above > below;
      const budget = shouldDropUp ? above : below;

      setDropUp(shouldDropUp);
      setListMaxHeight(Math.max(Math.min(DEFAULT_LIST_MAX_HEIGHT, budget), MIN_LIST_MAX_HEIGHT));
    }

    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('scroll', fit, true);
    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('scroll', fit, true);
    };
  }, [isOpen]);

  // Keep the active option in view as the arrows walk past the capped height.
  useEffect(() => {
    if (!isOpen) return;
    const list = listRef.current;
    const active = list?.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  function commit(option: SelectOption) {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
      return;
    }

    if (event.key === 'Tab') {
      setIsOpen(false);
      return;
    }

    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % Math.max(filtered.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(Math.max(filtered.length - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) commit(option);
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)} onKeyDown={onKeyDown}>
      {/* The real value for any consumer reading the form via FormData. */}
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        ref={buttonRef}
        type="button"
        id={controlId}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-haspopup="listbox"
        aria-describedby={field?.describedBy}
        aria-invalid={field?.hasError || undefined}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          CONTROL_CLASSES,
          'flex items-center justify-between gap-2 pr-10 text-left',
          field?.hasError && CONTROL_ERROR_CLASSES,
        )}
      >
        {/* Truncates rather than wrapping — a long label must not grow the control. */}
        <span className={cn('truncate', !selected && 'text-muted')}>
          {selected ? selected.label : placeholder}
        </span>
      </button>
      <ChevronDownIcon
        className="pointer-events-none absolute right-3.5 top-[21px] -translate-y-1/2 text-muted"
        aria-hidden
      />

      {isOpen ? (
        <div
          className={cn(
            'absolute left-0 right-0 z-[300] overflow-hidden rounded-field border-[1.5px] border-hairline bg-surface shadow-panel',
            dropUp ? 'bottom-full mb-1' : 'top-full mt-1',
          )}
        >
          <div className="relative border-b border-hairline-subtle">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listboxId}
              aria-activedescendant={
                filtered[activeIndex] ? `${listboxId}-${filtered[activeIndex]!.value}` : undefined
              }
              className="w-full bg-transparent py-2.5 pl-9 pr-3 text-[0.9rem] text-ink outline-none placeholder:text-muted"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="px-3.5 py-3 text-[0.9rem] text-muted">{emptyMessage}</p>
          ) : (
            /* The cap this component exists to make possible — a real DOM scroll
               container, unlike a native popup. Height is measured against the
               nearest scroll box so a Modal cannot slice the last rows off. */
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label={placeholder}
              style={{ maxHeight: listMaxHeight }}
              className="overflow-y-auto py-1"
            >
              {filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <li
                    key={option.value}
                    id={`${listboxId}-${option.value}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(option)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-[0.9rem] text-ink',
                      isActive && 'bg-row-hover',
                      isSelected && 'font-semibold text-brand-green',
                      option.disabled && 'cursor-not-allowed text-muted',
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? <CheckIcon className="shrink-0 text-brand-green" aria-hidden /> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
