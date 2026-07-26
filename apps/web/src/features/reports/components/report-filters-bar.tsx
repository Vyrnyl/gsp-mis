'use client';

import { Button, FormField, Input, Select, type SelectOption } from '@/shared/components/ui';

import { MAX_REPORT_RANGE_DAYS } from '../constants';
import type { ReportFilters } from '../types';

export interface ReportFiltersBarProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  /** Admin/Executive Council only — Troop Leader is implicitly scoped to their own troop. */
  troopOptions: SelectOption[] | null;
}

function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
          min={addDaysIso(filters.dateTo, -MAX_REPORT_RANGE_DAYS)}
          onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
        />
      </FormField>
      <FormField label="To">
        <Input
          type="date"
          value={filters.dateTo}
          min={filters.dateFrom}
          max={addDaysIso(filters.dateFrom, MAX_REPORT_RANGE_DAYS)}
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
