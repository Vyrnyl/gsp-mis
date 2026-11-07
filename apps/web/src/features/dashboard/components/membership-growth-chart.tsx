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

import type { GrowthPoint } from '../types';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip);

const CHART_OPTIONS: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    // Explicitly disabled — Analytics and Finance register ChartJS's `Legend` plugin
    // globally (a shared registry, not per-chart), so after visiting either page it
    // would otherwise switch on here too.
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

export interface MembershipGrowthChartProps {
  data: GrowthPoint[];
}

/**
 * Line chart — registry §4. Started as a port of the prototype's `.bar-chart` CSS bars;
 * switched to a line on 2026-11-07 at the user's request, styled to match Analytics'
 * `MembershipTrendChart` so the two Membership Growth charts read the same.
 */
export function MembershipGrowthChart({ data }: MembershipGrowthChartProps) {
  const summary = data.map((point) => `${point.label} ${point.count}`).join(', ');

  return (
    <div style={{ height: 160 }} role="img" aria-label={`New registrations by month: ${summary}`}>
      <Line
        aria-hidden
        data={{
          labels: data.map((point) => point.label),
          datasets: [
            {
              data: data.map((point) => point.count),
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
