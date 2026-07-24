'use client';

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

import { palette } from '@/shared/design/tokens';

import type { TrendPoint } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const CHART_OPTIONS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    // Explicitly disabled — `FinancialTrendChart` registers ChartJS's `Legend`
    // plugin globally (a shared registry, not per-chart) since all six analytics
    // charts are statically imported on one page; without this it would otherwise
    // switch on here too, same class of bug 3.1 hit with its donut.
    legend: { display: false },
    tooltip: { backgroundColor: palette.ink, padding: 8, cornerRadius: 6 },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: palette.muted, font: { size: 11 } } },
    y: {
      beginAtZero: true,
      ticks: { color: palette.muted, font: { size: 11 }, stepSize: 1 },
      grid: { color: palette.borderFaint },
    },
  },
};

export interface MembershipTrendChartProps {
  data: TrendPoint[];
}

/**
 * Membership Trends bar chart — registry §4. Same port technique as the dashboard's
 * `MembershipGrowthChart` (new registrations per month), a separate component here
 * because analytics owns its own chart set rather than importing across features.
 */
export function MembershipTrendChart({ data }: MembershipTrendChartProps) {
  const summary = data.map((point) => `${point.label} ${point.value}`).join(', ');

  return (
    <div style={{ height: 220 }} role="img" aria-label={`New registrations by month: ${summary}`}>
      <Bar
        aria-hidden
        data={{
          labels: data.map((point) => point.label),
          datasets: [
            {
              data: data.map((point) => point.value),
              backgroundColor: palette.green2,
              hoverBackgroundColor: palette.green,
              borderRadius: 6,
              maxBarThickness: 40,
            },
          ],
        }}
        options={CHART_OPTIONS}
      />
    </div>
  );
}
