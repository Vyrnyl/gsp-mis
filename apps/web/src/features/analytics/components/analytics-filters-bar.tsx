'use client';

import { FormField, Select, type SelectOption } from '@/shared/components/ui';

import { ALL_TROOPS, DATE_RANGE_OPTIONS } from '../constants';
import type { AnalyticsFilters, DateRange } from '../types';

export interface AnalyticsFiltersBarProps {
  filters: AnalyticsFilters;
  onChange: (filters: AnalyticsFilters) => void;
  /** `null` while the troop list is still loading — the Select renders disabled
   * rather than flashing an empty dropdown. */
  troopOptions: SelectOption[] | null;
  /** The Organization tab *is* the per-troop comparison, so scoping it to one troop
   * would collapse it to a single row. The filter stays visible (so it doesn't jump
   * in and out of the layout on tab change) but is disabled and explained. */
  isTroopFilterDisabled: boolean;
  /** Income and expenses have no troop association in the schema — `Expense` has no
   * member link at all — so the Financial tab's figures are council-wide regardless. */
  troopFilterNote: string | null;
}

/**
 * Page-level filters, applied above the tab strip: the six tabs share one fetch by
 * design (`AnalyticsView`), so filtering is a property of the page rather than of any
 * individual tab.
 */
export function AnalyticsFiltersBar({
  filters,
  onChange,
  troopOptions,
  isTroopFilterDisabled,
  troopFilterNote,
}: AnalyticsFiltersBarProps) {
  const troopSelectOptions: SelectOption[] = [
    { value: ALL_TROOPS, label: 'All Troops' },
    ...(troopOptions ?? []),
  ];

  return (
    <div className="mb-4 grid grid-cols-1 items-end gap-3.5 xs:grid-cols-2 lg2:grid-cols-4">
      <FormField label="Date range">
        <Select
          options={DATE_RANGE_OPTIONS}
          value={filters.range}
          onChange={(event) => onChange({ ...filters, range: event.target.value as DateRange })}
        />
      </FormField>

      <FormField label="Troop" hint={troopFilterNote ?? undefined}>
        <Select
          options={troopSelectOptions}
          value={filters.troopId}
          disabled={isTroopFilterDisabled || troopOptions === null}
          onChange={(event) => onChange({ ...filters, troopId: event.target.value })}
        />
      </FormField>
    </div>
  );
}
