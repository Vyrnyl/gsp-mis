import { ApiError } from '../../shared/utils/api-error';
import type { ExpenseWithRelations, FeeTypeWithCount, PaymentWithRelations } from './finance.repository';
import { financeRepository } from './finance.repository';
import type {
  CreateExpenseInput,
  CreateFeeTypeInput,
  CreatePaymentInput,
  ListExpensesQuery,
  ListPaymentsQuery,
  UpdateFeeTypeInput,
} from './finance.schema';
import type {
  ExpenseSummaryDto,
  FeeTypeDto,
  FinanceOverviewDto,
  ListFeeTypesResponseBody,
  ListMemberOptionsResponseBody,
  MonthlyFinancePointDto,
  PaymentSummaryDto,
} from './finance.types';
import type { PaginationMeta } from '../../shared/utils/api-response';
import { buildPaginationMeta } from '../../shared/utils/api-response';

function toMemberOptionDto(member: { id: string; firstName: string; lastName: string; troop: { name: string } | null }) {
  return { id: member.id, fullName: `${member.firstName} ${member.lastName}`, troopName: member.troop?.name ?? null };
}

function toFeeTypeDto(feeType: FeeTypeWithCount): FeeTypeDto {
  return {
    id: feeType.id,
    name: feeType.name,
    amount: feeType.amount.toNumber(),
    description: feeType.description,
    paymentCount: feeType._count.payments,
  };
}

function toPaymentSummaryDto(payment: PaymentWithRelations): PaymentSummaryDto {
  return {
    id: payment.id,
    memberId: payment.memberId,
    memberName: `${payment.member.firstName} ${payment.member.lastName}`,
    troopName: payment.member.troop?.name ?? null,
    feeTypeId: payment.feeTypeId,
    feeTypeName: payment.feeType.name,
    amount: payment.amount.toNumber(),
    paymentDate: payment.paymentDate.toISOString().slice(0, 10),
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    receivedByName: payment.receivedBy?.fullName ?? null,
  };
}

function toExpenseSummaryDto(expense: ExpenseWithRelations): ExpenseSummaryDto {
  return {
    id: expense.id,
    description: expense.description,
    amount: expense.amount.toNumber(),
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
    category: expense.category,
    approvedByName: expense.approvedBy?.fullName ?? null,
  };
}

function sixMonthsAgo(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 5, 1);
}

/** Last 6 calendar months, oldest first — same bucketing technique as the
 * dashboard feature's `buildGrowthPoints`, applied to two parallel series. */
function buildMonthlyTrend(
  payments: Array<{ paymentDate: Date; amount: { toNumber(): number } }>,
  expenses: Array<{ expenseDate: Date; amount: { toNumber(): number } }>,
): MonthlyFinancePointDto[] {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (5 - i), 1));
  const points = months.map((month) => ({
    label: month.toLocaleString('en-US', { month: 'short' }),
    income: 0,
    expense: 0,
    key: `${month.getFullYear()}-${month.getMonth()}`,
  }));

  for (const payment of payments) {
    const key = `${payment.paymentDate.getFullYear()}-${payment.paymentDate.getMonth()}`;
    const bucket = points.find((point) => point.key === key);
    if (bucket) bucket.income += payment.amount.toNumber();
  }
  for (const expense of expenses) {
    const key = `${expense.expenseDate.getFullYear()}-${expense.expenseDate.getMonth()}`;
    const bucket = points.find((point) => point.key === key);
    if (bucket) bucket.expense += expense.amount.toNumber();
  }

  return points.map(({ label, income, expense }) => ({ label, income, expense }));
}

export const financeService = {
  async listMemberOptions(): Promise<ListMemberOptionsResponseBody> {
    const members = await financeRepository.listMemberOptions();
    return { members: members.map(toMemberOptionDto) };
  },

  // Fee types
  async listFeeTypes(): Promise<ListFeeTypesResponseBody> {
    const feeTypes = await financeRepository.listFeeTypes();
    return { feeTypes: feeTypes.map(toFeeTypeDto) };
  },

  async createFeeType(input: CreateFeeTypeInput): Promise<FeeTypeDto> {
    const existing = await financeRepository.findFeeTypeByName(input.name.trim());
    if (existing) throw ApiError.conflict('A fee type with this name already exists.');
    const created = await financeRepository.createFeeType(input);
    return toFeeTypeDto(created);
  },

  async updateFeeType(id: string, input: UpdateFeeTypeInput): Promise<FeeTypeDto> {
    const feeType = await financeRepository.findFeeTypeById(id);
    if (!feeType) throw ApiError.notFound('Fee type not found.');

    const existing = await financeRepository.findFeeTypeByName(input.name.trim());
    if (existing && existing.id !== id) throw ApiError.conflict('A fee type with this name already exists.');

    const updated = await financeRepository.updateFeeType(id, input);
    return toFeeTypeDto(updated);
  },

  async deleteFeeType(id: string): Promise<void> {
    const feeType = await financeRepository.findFeeTypeById(id);
    if (!feeType) throw ApiError.notFound('Fee type not found.');
    if (feeType._count.payments > 0) {
      throw ApiError.conflict('Remove all payments using this fee type before deleting it.');
    }
    await financeRepository.deleteFeeType(id);
  },

  // Payments
  async listPayments(query: ListPaymentsQuery): Promise<{ payments: PaymentSummaryDto[]; meta: PaginationMeta }> {
    const { rows, total } = await financeRepository.listPayments(query);
    return { payments: rows.map(toPaymentSummaryDto), meta: buildPaginationMeta(query.page, query.pageSize, total) };
  },

  async createPayment(input: CreatePaymentInput, receivedById: string): Promise<PaymentSummaryDto> {
    const member = await financeRepository.findMemberById(input.memberId);
    if (!member) throw ApiError.badRequest('Selected member does not exist.');

    const feeType = await financeRepository.findFeeTypeById(input.feeTypeId);
    if (!feeType) throw ApiError.badRequest('Selected fee type does not exist.');

    const created = await financeRepository.createPayment(input, receivedById);
    return toPaymentSummaryDto(created);
  },

  // Expenses
  async listExpenses(query: ListExpensesQuery): Promise<{ expenses: ExpenseSummaryDto[]; meta: PaginationMeta }> {
    const { rows, total } = await financeRepository.listExpenses(query.page, query.pageSize);
    return { expenses: rows.map(toExpenseSummaryDto), meta: buildPaginationMeta(query.page, query.pageSize, total) };
  },

  async createExpense(input: CreateExpenseInput, approvedById: string): Promise<ExpenseSummaryDto> {
    const created = await financeRepository.createExpense(input, approvedById);
    return toExpenseSummaryDto(created);
  },

  // Summaries — every figure is computed live from `Payment`/`Expense` rows, not the
  // schema's stored `FinancialPeriod.totalIncome/totalExpense/balance` columns, same
  // simplification precedent as 2.2's `AttendanceSummary` staying unused.
  async getSummaries(): Promise<FinanceOverviewDto> {
    const [incomeAgg, expenseAgg, pendingCount, categoryRows, paymentsSince, expensesSince, period] =
      await Promise.all([
        financeRepository.totalIncome(),
        financeRepository.totalExpenses(),
        financeRepository.countPendingPayments(),
        financeRepository.expensesByCategory(),
        financeRepository.paymentsSince(sixMonthsAgo()),
        financeRepository.expensesSince(sixMonthsAgo()),
        financeRepository.currentPeriod(),
      ]);

    const totalIncome = incomeAgg._sum.amount?.toNumber() ?? 0;
    const totalExpense = expenseAgg._sum.amount?.toNumber() ?? 0;

    return {
      stats: [
        { id: 'income', label: 'Total Income', value: totalIncome },
        { id: 'expenses', label: 'Total Expenses', value: totalExpense },
        { id: 'balance', label: 'Council Balance', value: totalIncome - totalExpense },
        { id: 'pendingPayments', label: 'Pending Payments', value: pendingCount },
      ],
      monthlyTrend: buildMonthlyTrend(paymentsSince, expensesSince),
      expenseByCategory: categoryRows
        .filter((row) => row.category !== null && (row._sum.amount?.toNumber() ?? 0) > 0)
        .map((row) => ({ category: row.category as string, amount: row._sum.amount!.toNumber() })),
      period: period
        ? {
            id: period.id,
            name: period.name,
            startDate: period.startDate.toISOString().slice(0, 10),
            endDate: period.endDate.toISOString().slice(0, 10),
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
          }
        : null,
    };
  },
};
