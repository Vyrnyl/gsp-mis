'use client';

import { Card, FormField, Select, type SelectOption } from '@/shared/components/ui';

import { ALL_OPTION, DIMENSION_FILTER_META } from '../constants';
import type { AnalyticsDimensionFilters, AnalyticsDimensionId } from '../types';

/** Option lists for every dimension, loaded once by `AnalyticsView` and shared by
 * each tab's bar. `null` means "still loading" — the Select renders disabled rather
 * than flashing an empty dropdown, matching the page-level troop filter's behavior. */
export type DimensionOptions = Partial<Record<AnalyticsDimensionId, SelectOption[] | null>>;

export interface TabFiltersBarProps {
  /** Which dimensions this tab exposes, in display order (`TAB_DIMENSION_FILTERS`). */
  dimensions: AnalyticsDimensionId[];
  filters: AnalyticsDimensionFilters;
  onChange: (filters: AnalyticsDimensionFilters) => void;
  options: DimensionOptions;
  /** Rendered under the bar where a dimension applies unevenly across the tab's own
   * cards — the Financial tab's income side, for instance, has no activity or expense
   * category to filter by. Stating that beats letting a filter look broken. */
  note?: string | null;
}

/**
 * One filter bar, reused by every tab that has dimensions worth narrowing (2026-09-16
 * R4 revision) — rather than five near-identical bars, which is how one tab's filter
 * ends up behaving differently from another's.
 *
 * Sits inside its own tab's panel, above that tab's cards, so the dimensions on show
 * always belong to the data underneath them. The page-level date-range and troop
 * filters stay above the tab strip and compose with whatever is set here.
 */
export function TabFiltersBar({ dimensions, filters, onChange, options, note }: TabFiltersBarProps) {
  if (dimensions.length === 0) return null;

  return (
    <Card className="mb-4">
      <div className="grid grid-cols-1 items-end gap-3.5 xs:grid-cols-2 lg2:grid-cols-3">
        {dimensions.map((dimension) => {
          const meta = DIMENSION_FILTER_META[dimension];
          const loaded = options[dimension];

          return (
            <FormField key={dimension} label={meta.label}>
              <Select
                options={[{ value: ALL_OPTION, label: meta.allLabel }, ...(loaded ?? [])]}
                value={filters[dimension]}
                // `undefined` (never requested) and `null` (in flight) both mean there
                // is nothing to choose from yet.
                disabled={loaded === null || loaded === undefined}
                onChange={(event) => onChange({ ...filters, [dimension]: event.target.value })}
              />
            </FormField>
          );
        })}
      </div>

      {note ? <p className="mt-2.5 text-[0.8rem] text-muted">{note}</p> : null}
    </Card>
  );
}
