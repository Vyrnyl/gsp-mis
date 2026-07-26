import type {
  ExpenseFormValues,
  ExpenseSummary,
  FeeTypeFormValues,
  FeeTypeItem,
  FeeTypeOption,
  FinanceOverview,
  MemberOption,
  PaymentFormValues,
  PaymentMethod,
  PaymentStatus,
  PaymentSummary,
} from '../types';

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface RawEnvelope<T> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

interface ApiSuccess<T> {
  data: T;
  meta?: PaginationMeta;
}

export class FinanceRequestError extends Error {
  constructor(
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'FinanceRequestError';
  }
}

/** Calls this app's own `/api/finance/*` BFF routes, never the Express API directly (code-standards.md §7.4). */
async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const json = (await response.json()) as RawEnvelope<T>;

  if (!response.ok || !json.success || json.data === undefined) {
    throw new FinanceRequestError(json.error?.message ?? 'Something went wrong. Please try again.', json.error?.details);
  }

  return { data: json.data, meta: json.meta };
}

export async function getFinanceOverview(): Promise<FinanceOverview> {
  const { data } = await request<FinanceOverview>('/api/finance/summaries');
  return data;
}

export async function listMemberOptions(): Promise<MemberOption[]> {
  const { data } = await request<{ members: MemberOption[] }>('/api/finance/member-options');
  return data.members;
}

export interface ListPaymentsResult {
  payments: PaymentSummary[];
  totalItems: number;
}

export async function listPayments(
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    feeTypeId?: string;
    paymentMethod?: PaymentMethod;
    status?: PaymentStatus;
  } = {},
): Promise<ListPaymentsResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);
  if (params.feeTypeId) query.set('feeTypeId', params.feeTypeId);
  if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);
  if (params.status) query.set('status', params.status);
  const search = query.toString();

  const { data, meta } = await request<{ payments: PaymentSummary[] }>(`/api/finance/payments${search ? `?${search}` : ''}`);
  return { payments: data.payments, totalItems: meta?.totalItems ?? data.payments.length };
}

export async function recordPayment(values: PaymentFormValues): Promise<PaymentSummary> {
  const { data } = await request<{ payment: PaymentSummary }>('/api/finance/payments', {
    method: 'POST',
    body: JSON.stringify(values),
  });
  return data.payment;
}

export interface ListExpensesResult {
  expenses: ExpenseSummary[];
  totalItems: number;
}

export async function listExpenses(params: { page?: number; pageSize?: number } = {}): Promise<ListExpensesResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const search = query.toString();

  const { data, meta } = await request<{ expenses: ExpenseSummary[] }>(`/api/finance/expenses${search ? `?${search}` : ''}`);
  return { expenses: data.expenses, totalItems: meta?.totalItems ?? data.expenses.length };
}

export async function recordExpense(values: ExpenseFormValues): Promise<ExpenseSummary> {
  const { data } = await request<{ expense: ExpenseSummary }>('/api/finance/expenses', {
    method: 'POST',
    body: JSON.stringify({ ...values, category: values.category || undefined }),
  });
  return data.expense;
}

export async function listFeeTypes(): Promise<FeeTypeItem[]> {
  const { data } = await request<{ feeTypes: FeeTypeItem[] }>('/api/finance/fee-types');
  return data.feeTypes;
}

export async function listFeeTypeOptions(): Promise<FeeTypeOption[]> {
  const feeTypes = await listFeeTypes();
  return feeTypes.map((feeType) => ({ id: feeType.id, name: feeType.name, amount: feeType.amount }));
}

export async function createFeeType(values: FeeTypeFormValues): Promise<FeeTypeItem> {
  const { data } = await request<{ feeType: FeeTypeItem }>('/api/finance/fee-types', {
    method: 'POST',
    body: JSON.stringify({ ...values, description: values.description || undefined }),
  });
  return data.feeType;
}

export async function updateFeeType(id: string, values: FeeTypeFormValues): Promise<FeeTypeItem> {
  const { data } = await request<{ feeType: FeeTypeItem }>(`/api/finance/fee-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...values, description: values.description || undefined }),
  });
  return data.feeType;
}

export async function deleteFeeType(id: string): Promise<void> {
  await request<{ deleted: true }>(`/api/finance/fee-types/${id}`, { method: 'DELETE' });
}
