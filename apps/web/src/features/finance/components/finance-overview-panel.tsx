import { Card, CardHeader, ChartSkeleton, ErrorState, StatCard, StatCardSkeleton } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format-currency';

import { FINANCE_STAT_PRESENTATION } from '../constants';
import type { FinanceOverview, ViewState } from '../types';
import { ExpenseCategoryDonut } from './expense-category-donut';
import { FinanceTrendChart } from './finance-trend-chart';

export interface FinanceOverviewPanelProps {
  viewState: ViewState;
  overview: FinanceOverview | null;
  onRetry: () => void;
}

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function FinanceOverviewPanel({ viewState, overview, onRetry }: FinanceOverviewPanelProps) {
  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load the financial overview. Check your connection and try again." />
      </Card>
    );
  }

  if (viewState === 'loading' || !overview) {
    return (
      <div>
        <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3.5 lg2:grid-cols-2">
          <Card>
            <ChartSkeleton />
          </Card>
          <Card>
            <ChartSkeleton />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        {overview.stats.map((stat) => {
          const presentation = FINANCE_STAT_PRESENTATION[stat.id] ?? FINANCE_STAT_PRESENTATION['income']!;
          return (
            <StatCard
              key={stat.id}
              icon={presentation.icon}
              tone={presentation.tone}
              value={stat.id === 'pendingPayments' ? stat.value : formatCurrency(stat.value)}
              label={stat.label}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg2:grid-cols-2">
        <Card>
          <CardHeader title="Income vs. Expense" subtitle="Last 6 months" />
          {overview.monthlyTrend.length > 0 ? (
            <FinanceTrendChart data={overview.monthlyTrend} />
          ) : (
            <p className="py-8 text-center text-[0.85rem] text-muted">No transactions recorded yet.</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Expenses by Category" />
          {overview.expenseByCategory.length > 0 ? (
            <ExpenseCategoryDonut data={overview.expenseByCategory} />
          ) : (
            <p className="py-8 text-center text-[0.85rem] text-muted">No expenses recorded yet.</p>
          )}
        </Card>
      </div>

      {overview.period ? (
        <Card className="mt-3.5">
          <CardHeader title="Budget & Collection Summary" subtitle={overview.period.name} />
          <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-3">
            <div>
              <p className="text-[0.78rem] text-muted">Period</p>
              <p className="font-semibold text-ink">
                {toDisplayDate(overview.period.startDate)} – {toDisplayDate(overview.period.endDate)}
              </p>
            </div>
            <div>
              <p className="text-[0.78rem] text-muted">Total Income</p>
              <p className="font-semibold text-brand-green">{formatCurrency(overview.period.totalIncome)}</p>
            </div>
            <div>
              <p className="text-[0.78rem] text-muted">Total Expenses</p>
              <p className="font-semibold text-brand-red">{formatCurrency(overview.period.totalExpense)}</p>
            </div>
          </div>
          <p className="mt-3.5 border-t border-hairline-subtle pt-3.5 text-[0.9rem]">
            Balance:{' '}
            <span className={overview.period.balance >= 0 ? 'font-bold text-brand-green' : 'font-bold text-brand-red'}>
              {formatCurrency(overview.period.balance)}
            </span>
          </p>
        </Card>
      ) : null}
    </div>
  );
}
