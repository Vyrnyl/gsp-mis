/** Mirrors the `PaymentStatus` enum in `apps/api/prisma/schema.prisma`. */
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'cancelled';

/** Mirrors the `PaymentMethod` enum in `apps/api/prisma/schema.prisma`. */
export type PaymentMethod = 'cash' | 'bank_transfer' | 'gcash' | 'cheque';

export type ViewState = 'loading' | 'error' | 'ready';
export type FinanceTabId = 'overview' | 'payments' | 'expenses' | 'fee-types';

export interface MemberOption {
  id: string;
  fullName: string;
  troopName: string | null;
}

export interface FeeTypeOption {
  id: string;
  name: string;
  amount: number;
}

/** `GET /finance/fee-types` row. */
export interface FeeTypeItem {
  id: string;
  name: string;
  amount: number;
  description: string | null;
  paymentCount: number;
}

export interface FeeTypeFormValues {
  name: string;
  amount: number | undefined;
  description: string;
}

/** `GET /finance/payments` row. */
export interface PaymentSummary {
  id: string;
  memberId: string;
  memberName: string;
  troopName: string | null;
  feeTypeId: string;
  feeTypeName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  receivedByName: string | null;
}

export interface PaymentFormValues {
  memberId: string;
  feeTypeId: string;
  amount: number | undefined;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
}

/** `GET /finance/expenses` row. */
export interface ExpenseSummary {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  category: string | null;
  approvedByName: string | null;
}

export interface ExpenseFormValues {
  description: string;
  amount: number | undefined;
  expenseDate: string;
  category: string;
}

/** One bucket in the Income vs. Expense trend chart. */
export interface MonthlyFinancePoint {
  label: string;
  income: number;
  expense: number;
}

/** One slice of the Expenses by Category donut. */
export interface ExpenseCategorySlice {
  category: string;
  amount: number;
}

/** Server-computed from live `Payment`/`Expense` rows — `FinancialPeriod`'s own
 * `totalIncome`/`totalExpense`/`balance` columns stay unused, same simplification
 * precedent as 2.2's `AttendanceSummary`. */
export interface FinancialPeriodSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

/** Stat cards are presentation-only past `id`/`label`/`value` — icon/tone are looked
 * up client-side in `constants.ts`, matching the dashboard feature's convention. */
export interface FinanceStatValue {
  id: 'income' | 'expenses' | 'balance' | 'pendingPayments';
  label: string;
  value: number;
}

export interface FinanceOverview {
  stats: FinanceStatValue[];
  monthlyTrend: MonthlyFinancePoint[];
  expenseByCategory: ExpenseCategorySlice[];
  period: FinancialPeriodSummary | null;
}
