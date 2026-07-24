import {
  ApprovalIcon,
  BalanceIcon,
  ExpenseIcon,
  IncomeIcon,
  type IconType,
} from '@/shared/components/icons';
import type { BadgeTone, StatCardTone } from '@/shared/components/ui';
import { palette } from '@/shared/design/tokens';

import type {
  ExpenseFormValues,
  FeeTypeFormValues,
  FinanceTabId,
  PaymentFormValues,
  PaymentMethod,
  PaymentStatus,
} from './types';

export const FINANCE_TABS: { id: FinanceTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'payments', label: 'Payments' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'fee-types', label: 'Fee Types' },
];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

/** Paid is the settled, money-in-hand state (green) — matches members' `active` convention. */
export const PAYMENT_STATUS_TONES: Record<PaymentStatus, BadgeTone> = {
  pending: 'blue',
  paid: 'green',
  refunded: 'gold',
  cancelled: 'red',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  gcash: 'GCash',
  cheque: 'Cheque',
};

export const PAYMENT_METHOD_OPTIONS = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }));

export const PAYMENT_STATUS_OPTIONS = (Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map(
  (value) => ({ value, label: PAYMENT_STATUS_LABELS[value] }),
);

/**
 * Stat cards are presentation-only past `id`/`label`/`value` — icon/tone are looked
 * up client-side here rather than sent over the wire, same convention as the
 * dashboard feature's `*_STAT_PRESENTATION` maps.
 */
export const FINANCE_STAT_PRESENTATION: Record<string, { icon: IconType; tone: StatCardTone }> = {
  income: { icon: IncomeIcon, tone: 'green' },
  expenses: { icon: ExpenseIcon, tone: 'red' },
  balance: { icon: BalanceIcon, tone: 'blue' },
  pendingPayments: { icon: ApprovalIcon, tone: 'gold' },
};

/** Chart colors — mirrors the dashboard's `STATUS_CHART_COLORS` hex-value convention (ChartJS needs real values, not Tailwind classes). */
export const FINANCE_CHART_COLORS = {
  income: palette.green2,
  expense: palette.red,
};

export const EXPENSE_CATEGORY_CHART_COLORS = [
  palette.green2,
  palette.blue,
  palette.gold2,
  palette.red,
  palette.muted,
];

export const EMPTY_PAYMENT_FORM_VALUES: PaymentFormValues = {
  memberId: '',
  feeTypeId: '',
  amount: undefined,
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'cash',
  status: 'paid',
};

export const EMPTY_EXPENSE_FORM_VALUES: ExpenseFormValues = {
  description: '',
  amount: undefined,
  expenseDate: new Date().toISOString().slice(0, 10),
  category: '',
};

export const EMPTY_FEE_TYPE_FORM_VALUES: FeeTypeFormValues = {
  name: '',
  amount: undefined,
  description: '',
};
