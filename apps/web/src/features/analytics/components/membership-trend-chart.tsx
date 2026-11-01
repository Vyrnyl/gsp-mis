'use client';

import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { palette } from '@/shared/design/tokens';

import type { TrendPoint } from '../types';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip);

const CHART_OPTIONS: ChartOptions<'line'> = {
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
 * Membership Trends line chart — registry §4. Same port technique as the dashboard's
 * `MembershipGrowthChart` (new registrations per month), a separate component here
 * because analytics owns its own chart set rather than importing across features.
 */
export function MembershipTrendChart({ data }: MembershipTrendChartProps) {
  const summary = data.map((point) => `${point.label} ${point.value}`).join(', ');

  return (
    <div style={{ height: 220 }} role="img" aria-label={`New registrations by month: ${summary}`}>
      <Line
        aria-hidden
        data={{
          labels: data.map((point) => point.label),
          datasets: [
            {
              data: data.map((point) => point.value),
              borderColor: palette.green2,
              borderWidth: 2,
              pointBackgroundColor: palette.green2,
              pointHoverBackgroundColor: palette.green,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        }}
        options={CHART_OPTIONS}
      />
    </div>
  );
}
