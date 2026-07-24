'use client';

import { Button, FormField, Input, Select, type SelectOption } from '@/shared/components/ui';

import type { ReportFilters } from '../types';

export interface ReportFiltersBarProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  /** Admin/Executive Council only — Troop Leader is implicitly scoped to their own troop. */
  troopOptions: SelectOption[] | null;
}

/** Date-range + optional troop filter row. Native `<input type="date">`, matching
 * 1.3/2.1's precedent — a custom `DatePicker` still isn't built (ui-registry.md §9). */
export function ReportFiltersBar({ filters, onChange, onGenerate, isGenerating, troopOptions }: ReportFiltersBarProps) {
  return (
    <div className="mb-5 grid grid-cols-1 items-end gap-3.5 xs:grid-cols-2 lg2:grid-cols-4">
      <FormField label="From">
        <Input
          type="date"
          value={filters.dateFrom}
          max={filters.dateTo}
          onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
        />
      </FormField>
      <FormField label="To">
        <Input
          type="date"
          value={filters.dateTo}
          min={filters.dateFrom}
          onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
        />
      </FormField>
      {troopOptions ? (
        <FormField label="Troop">
          <Select
            options={troopOptions}
            value={filters.troopId}
            onChange={(event) => onChange({ ...filters, troopId: event.target.value })}
          />
        </FormField>
      ) : null}
      <Button onClick={onGenerate} isLoading={isGenerating}>
        Generate Preview
      </Button>
    </div>
  );
}
