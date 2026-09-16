import { AnalyticsIcon, InfoIcon } from '@/shared/components/icons';
import {
  Alert,
  Card,
  CardHeader,
  ChartSkeleton,
  EmptyState,
  ErrorState,
  StatCard,
  StatCardSkeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
} from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format-currency';

import { FINANCIAL_STAT_PRESENTATION } from '../constants';
import type { FinancialAnalytics, ViewState } from '../types';
import { BreakdownChart } from './breakdown-chart';
import { FinancialTrendChart } from './financial-trend-chart';
import { MoneyTable } from './money-table';

export interface FinancialTrendsPanelProps {
  viewState: ViewState;
  data: FinancialAnalytics | null;
  onRetry: () => void;
}

/**
 * 2026-09-16 R4 revision — this tab used to be three stat cards and one income-vs-expense
 * trend: four totals, split by nothing, which is precisely what `update.txt`'s financial
 * line says not to show. It now breaks the same in-range money down by school, activity
 * and category, and compares income against spending per school.
 *
 * Every breakdown is charted *and* tabulated: the chart answers "who is biggest?" at a
 * glance, the table carries the exact figures, and a screen reader gets real rows rather
 * than a canvas.
 */
export function FinancialTrendsPanel({ viewState, data, onRetry }: FinancialTrendsPanelProps) {
  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load financial analytics. Check your connection and try again." />
      </Card>
    );
  }

  if (viewState === 'loading' || !data) {
    return (
      <div>
        <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card>
          <TableSkeleton rows={4} columns={4} />
        </Card>
      </div>
    );
  }

  // "Council-wide" is a real bucket, not a missing value — spending that genuinely
  // belongs to no single school. It stays in the tables, but is dropped from the
  // ranking chart, where it would tower over every actual school and answer a
  // question ("which school spends most?") that it is not an answer to.
  const spendingBySchool = data.expenseBySchool.filter((row) => row.id !== 'unassigned');
  const spendingByActivity = data.expenseByEvent.filter((row) => row.id !== 'unassigned');

  const hasMoney = data.trend.some((point) => point.income > 0 || point.expense > 0);

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {data.stats.map((stat) => {
          const presentation = FINANCIAL_STAT_PRESENTATION[stat.id] ?? FINANCIAL_STAT_PRESENTATION['income']!;
          return <StatCard key={stat.id} icon={presentation.icon} tone={presentation.tone} value={formatCurrency(Number(stat.value))} label={stat.label} />;
        })}
      </div>

      <Card className="mb-3.5">
        <CardHeader title="Financial Trends" subtitle="Income vs. expense over the selected range" />
        {hasMoney ? (
          <FinancialTrendChart data={data.trend} />
        ) : (
          <EmptyState
            icon={AnalyticsIcon}
            title="No transactions in this period"
            description="Once payments or expenses are recorded within the selected range, the trend will appear here."
          />
        )}
      </Card>

      <Card className="mb-3.5">
        <CardHeader title="Spending by Category" subtitle="What the council's money is being spent on" />
        {data.expenseByCategory.length > 0 ? (
          <BreakdownChart
            labels={data.expenseByCategory.map((row) => row.label)}
            values={data.expenseByCategory.map((row) => row.amount)}
            valueLabel="pesos"
          />
        ) : (
          <EmptyState
            icon={AnalyticsIcon}
            title="No spending recorded"
            description="No expense falls within the current selection."
          />
        )}
      </Card>

      {/* School and activity attribution only became possible with the 2026-09-16
          migration, so expenses recorded before it — and any genuinely council-wide
          cost — carry no school or event. Charting an empty set would waste a full
          card and imply the data is missing rather than unattributed, so each chart
          renders only when something is actually attributed; the tables below always
          carry the Council-wide bucket so the total still reconciles. */}
      {spendingBySchool.length > 0 ? (
        <Card className="mb-3.5">
          <CardHeader title="Spending by School" subtitle="Which schools the council's money is going to" />
          <BreakdownChart
            labels={spendingBySchool.map((row) => row.label)}
            values={spendingBySchool.map((row) => row.amount)}
            valueLabel="pesos"
          />
        </Card>
      ) : null}

      {spendingByActivity.length > 0 ? (
        <Card className="mb-3.5">
          <CardHeader title="Spending by Activity" subtitle="Which events the council's money is going to" />
          <BreakdownChart
            labels={spendingByActivity.map((row) => row.label)}
            values={spendingByActivity.map((row) => row.amount)}
            valueLabel="pesos"
          />
        </Card>
      ) : null}

      {/* Stated once, where a reader would otherwise wonder why the two charts above
          are absent — rather than repeated as two identical empty cards. */}
      {spendingBySchool.length === 0 && spendingByActivity.length === 0 && data.expenseByCategory.length > 0 ? (
        <Card className="mb-3.5">
          <Alert tone="info">
            None of the spending in this selection is attributed to a school or an event, so those two breakdowns have
            nothing to chart. It is all recorded as council-wide — visible in the tables below.
          </Alert>
        </Card>
      ) : null}

      <Card className="mb-3.5">
        <CardHeader title="The detail" subtitle="Exact figures behind the charts above, for the current selection" />
        <div className="grid grid-cols-1 gap-3.5 lg2:grid-cols-2">
          <MoneyTable
            heading="Income by School"
            caption="Income by school"
            firstColumn="School"
            rows={data.incomeBySchool}
            emptyIcon={InfoIcon}
            emptyTitle="No income recorded"
          />
          <MoneyTable
            heading="Spending by Category"
            caption="Spending by category"
            firstColumn="Category"
            rows={data.expenseByCategory}
            emptyIcon={AnalyticsIcon}
            emptyTitle="No spending recorded"
          />
          <MoneyTable
            heading="Spending by School"
            caption="Spending by school"
            firstColumn="School"
            rows={data.expenseBySchool}
            emptyIcon={AnalyticsIcon}
            emptyTitle="No spending recorded"
          />
          <MoneyTable
            heading="Spending by Activity"
            caption="Spending by activity"
            firstColumn="Activity"
            rows={data.expenseByEvent}
            emptyIcon={AnalyticsIcon}
            emptyTitle="No spending recorded"
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Income vs. Spending by School"
          subtitle="The two sides side by side — only schools appear, since council-wide costs belong to none of them"
        />
        {data.schoolFinance.length > 0 ? (
          <TableWrapper>
            <Table caption="Income versus spending per school">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>School</TableHeaderCell>
                  <TableHeaderCell>Income</TableHeaderCell>
                  <TableHeaderCell>Spending</TableHeaderCell>
                  <TableHeaderCell>Net</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.schoolFinance.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="whitespace-nowrap">{row.label}</span>
                    </TableCell>
                    <TableCell>{formatCurrency(row.income)}</TableCell>
                    <TableCell>{formatCurrency(row.expense)}</TableCell>
                    {/* Colour carries meaning here, so the sign carries it too — a
                        red figure and a minus sign, not colour alone (ui-rules §9). */}
                    <TableCell>
                      <span className={row.net < 0 ? 'font-semibold text-brand-red' : 'font-semibold text-brand-green'}>
                        {formatCurrency(row.net)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        ) : (
          <EmptyState
            icon={InfoIcon}
            title="Nothing to compare yet"
            description="Once income and spending are both attributed to a school, the comparison appears here."
          />
        )}
      </Card>
    </div>
  );
}
