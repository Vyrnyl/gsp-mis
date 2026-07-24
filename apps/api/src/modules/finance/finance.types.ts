import type { PaymentMethod, PaymentStatus } from './finance.schema';

export interface MemberOptionDto {
  id: string;
  fullName: string;
  troopName: string | null;
}

export interface FeeTypeOptionDto {
  id: string;
  name: string;
  amount: number;
}

export interface FeeTypeDto {
  id: string;
  name: string;
  amount: number;
  description: string | null;
  paymentCount: number;
}

export interface PaymentSummaryDto {
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

export interface ExpenseSummaryDto {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  category: string | null;
  approvedByName: string | null;
}

export interface MonthlyFinancePointDto {
  label: string;
  income: number;
  expense: number;
}

export interface ExpenseCategorySliceDto {
  category: string;
  amount: number;
}

export interface FinancialPeriodSummaryDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface FinanceStatValueDto {
  id: 'income' | 'expenses' | 'balance' | 'pendingPayments';
  label: string;
  value: number;
}

export interface FinanceOverviewDto {
  stats: FinanceStatValueDto[];
  monthlyTrend: MonthlyFinancePointDto[];
  expenseByCategory: ExpenseCategorySliceDto[];
  period: FinancialPeriodSummaryDto | null;
}

export interface ListMemberOptionsResponseBody {
  members: MemberOptionDto[];
}
export interface ListFeeTypesResponseBody {
  feeTypes: FeeTypeDto[];
}
