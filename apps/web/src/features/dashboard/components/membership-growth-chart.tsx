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

import type { GrowthPoint } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const CHART_OPTIONS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
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
 * Bar chart — registry §4. Ports the prototype's `.bar-chart`/`.bar` CSS bars to
 * `react-chartjs-2` (settled decision #2), keeping the green fill. The prototype's
 * per-bar vertical gradient is simplified to a solid fill — a minor ChartJS-port
 * deviation, flagged at visual verify.
 */
export function MembershipGrowthChart({ data }: MembershipGrowthChartProps) {
  const summary = data.map((point) => `${point.label} ${point.count}`).join(', ');

  return (
    <div style={{ height: 160 }} role="img" aria-label={`New registrations by month: ${summary}`}>
      <Bar
        aria-hidden
        data={{
          labels: data.map((point) => point.label),
          datasets: [
            {
              data: data.map((point) => point.count),
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
