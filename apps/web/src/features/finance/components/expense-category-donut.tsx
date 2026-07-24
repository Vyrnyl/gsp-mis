'use client';

import { ArcElement, Chart as ChartJS, Tooltip, type ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

import { palette } from '@/shared/design/tokens';
import { formatCurrency } from '@/shared/utils/format-currency';

import { EXPENSE_CATEGORY_CHART_COLORS } from '../constants';
import type { ExpenseCategorySlice } from '../types';

ChartJS.register(ArcElement, Tooltip);

const CHART_OPTIONS: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    // Explicitly disabled — sibling charts on this page register ChartJS's `Legend`
    // plugin globally (a shared registry, not per-chart), which would otherwise turn
    // on Chart.js's own built-in legend here and collide with the custom HTML one
    // below.
    legend: { display: false },
    tooltip: { backgroundColor: palette.ink, padding: 8, cornerRadius: 6 },
  },
};

export interface ExpenseCategoryDonutProps {
  data: ExpenseCategorySlice[];
}

/**
 * Expenses by Category donut — registry §4, same `react-chartjs-2` port and
 * legend-beside-chart layout as the dashboard's `MemberStatusDonut`.
 */
export function ExpenseCategoryDonut({ data }: ExpenseCategoryDonutProps) {
  const total = data.reduce((sum, slice) => sum + slice.amount, 0);

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div style={{ width: 120, height: 120 }} className="relative shrink-0">
        <Doughnut
          role="img"
          aria-label={`Expenses by category: ${data.map((s) => `${s.category} ${formatCurrency(s.amount)}`).join(', ')}`}
          data={{
            labels: data.map((slice) => slice.category),
            datasets: [
              {
                data: data.map((slice) => slice.amount),
                backgroundColor: data.map((_, index) => EXPENSE_CATEGORY_CHART_COLORS[index % EXPENSE_CATEGORY_CHART_COLORS.length]),
                borderWidth: 2,
                borderColor: palette.surface,
              },
            ],
          }}
          options={CHART_OPTIONS}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[0.72rem] font-bold text-ink">
          {formatCurrency(total)}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((slice, index) => (
          <div key={slice.category} className="flex items-center gap-2 text-[0.82rem] text-ink-soft">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: EXPENSE_CATEGORY_CHART_COLORS[index % EXPENSE_CATEGORY_CHART_COLORS.length] }}
            />
            {slice.category} — {total > 0 ? Math.round((slice.amount / total) * 100) : 0}%
          </div>
        ))}
      </div>
    </div>
  );
}
