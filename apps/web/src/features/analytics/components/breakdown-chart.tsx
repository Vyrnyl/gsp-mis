'use client';

import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip, type ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';

import { palette } from '@/shared/design/tokens';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export interface BreakdownChartProps {
  labels: string[];
  values: number[];
  /** Unit named in the tooltip and the aria summary, e.g. "members". */
  valueLabel: string;
}

/**
 * One horizontal bar chart shared by all four breakdown dimensions (2026-09-16
 * revision) — school, level, badge area and activity type differ only in their
 * labels and unit, so a single parameterised chart replaces four near-identical ones.
 * Horizontal for the same reason as `BadgeCompletionChart`: names read better as row
 * labels than as crowded x-axis ticks.
 */
export function BreakdownChart({ labels, values, valueLabel }: BreakdownChartProps) {
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      // Explicitly disabled — ChartJS's `Legend` registry is global and every chart
      // on this page is statically imported, so an enabled legend elsewhere would
      // otherwise leak a stray entry onto this one.
      legend: { display: false },
      tooltip: {
        backgroundColor: palette.ink,
        padding: 8,
        cornerRadius: 6,
        callbacks: { label: (ctx) => `${ctx.formattedValue} ${valueLabel}` },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: palette.muted, font: { size: 11 }, precision: 0 },
        grid: { color: palette.borderFaint },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: palette.muted,
          font: { size: 11 },
          // Long names (a full university name, say) otherwise get clipped at the
          // start on narrow screens — ChartJS truncates the label rather than the
          // axis, so "…Seminary Academy (ICSA)" loses the words that identify it.
          // Truncating at the *end* keeps the distinguishing part readable, and the
          // table below always carries the full name.
          callback(value) {
            const label = String(this.getLabelForValue(Number(value)));
            return label.length > 28 ? `${label.slice(0, 27)}…` : label;
          },
        },
      },
    },
  };

  const summary = labels.map((label, index) => `${label} ${values[index]} ${valueLabel}`).join(', ');

  return (
    <div style={{ height: Math.max(180, labels.length * 42) }} role="img" aria-label={`Breakdown by ${valueLabel}: ${summary}`}>
      <Bar
        aria-hidden
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: palette.green2,
              hoverBackgroundColor: palette.green,
              borderRadius: 6,
              maxBarThickness: 26,
            },
          ],
        }}
        options={options}
      />
    </div>
  );
}
