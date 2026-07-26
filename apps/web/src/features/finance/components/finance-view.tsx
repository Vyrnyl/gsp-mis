'use client';

import { useCallback, useEffect, useState } from 'react';

import { Tabs, useToast } from '@/shared/components/ui';

import { FINANCE_TABS } from '../constants';
import {
  createFeeType,
  deleteFeeType,
  getFinanceOverview,
  listExpenses,
  listFeeTypeOptions,
  listFeeTypes,
  listMemberOptions,
  listPayments,
  recordExpense,
  recordPayment,
  updateFeeType,
} from '../services/finance.service';
import type {
  ExpenseFormValues,
  ExpenseSummary,
  FeeTypeFormValues,
  FeeTypeItem,
  FeeTypeOption,
  FinanceOverview,
  FinanceTabId,
  MemberOption,
  PaymentFormValues,
  PaymentMethod,
  PaymentStatus,
  PaymentSummary,
  ViewState,
} from '../types';
import { ExpensesPanel } from './expenses-panel';
import { FeeTypesPanel } from './fee-types-panel';
import { FinanceOverviewPanel } from './finance-overview-panel';
import { PaymentsPanel } from './payments-panel';

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

export interface FinanceViewProps {
  canManage: boolean;
}

/**
 * Loop steps 3–5 (Contract + Wire Read + Wire Write) for Feature 3.1.
 *
 * `canManage` (`finance:write` — Administrator only, per the pre-build RBAC fix
 * removing it from Executive Council) gates every record/add/edit/delete action;
 * Executive Council reaches all four tabs read-only. Payments and Expenses are
 * append-only (no edit/delete) — project-overview.md grants "Record payments" /
 * "Record expenses" with no edit/delete verb, same precedent as 2.3's activity
 * reports staying append-only. The member/fee-type option lookups for the Record
 * Payment modal are only fetched for `canManage` users, since only Admin ever opens
 * that modal.
 */
export function FinanceView({ canManage }: FinanceViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<FinanceTabId>('overview');

  const [overviewState, setOverviewState] = useState<ViewState>('loading');
  const [overview, setOverview] = useState<FinanceOverview | null>(null);

  const [paymentsState, setPaymentsState] = useState<ViewState>('loading');
  const [payments, setPayments] = useState<PaymentSummary[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const [debouncedPaymentsSearch, setDebouncedPaymentsSearch] = useState('');
  const [paymentsFeeTypeFilter, setPaymentsFeeTypeFilter] = useState('all');
  const [paymentsMethodFilter, setPaymentsMethodFilter] = useState('all');
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPaymentsSearch(paymentsSearch), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [paymentsSearch]);

  useEffect(() => {
    setPaymentsPage(1);
  }, [debouncedPaymentsSearch, paymentsFeeTypeFilter, paymentsMethodFilter, paymentsStatusFilter]);

  const [expensesState, setExpensesState] = useState<ViewState>('loading');
  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [expensesPage, setExpensesPage] = useState(1);

  const [feeTypesState, setFeeTypesState] = useState<ViewState>('loading');
  const [feeTypes, setFeeTypes] = useState<FeeTypeItem[]>([]);

  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [feeTypeOptions, setFeeTypeOptions] = useState<FeeTypeOption[]>([]);

  const fetchOverview = useCallback(async () => {
    setOverviewState('loading');
    try {
      const result = await getFinanceOverview();
      setOverview(result);
      setOverviewState('ready');
    } catch {
      setOverviewState('error');
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setPaymentsState('loading');
    try {
      const result = await listPayments({
        page: paymentsPage,
        pageSize: PAGE_SIZE,
        search: debouncedPaymentsSearch || undefined,
        feeTypeId: paymentsFeeTypeFilter !== 'all' ? paymentsFeeTypeFilter : undefined,
        paymentMethod: paymentsMethodFilter !== 'all' ? (paymentsMethodFilter as PaymentMethod) : undefined,
        status: paymentsStatusFilter !== 'all' ? (paymentsStatusFilter as PaymentStatus) : undefined,
      });
      setPayments(result.payments);
      setPaymentsTotal(result.totalItems);
      setPaymentsState('ready');
    } catch {
      setPaymentsState('error');
    }
  }, [paymentsPage, debouncedPaymentsSearch, paymentsFeeTypeFilter, paymentsMethodFilter, paymentsStatusFilter]);

  const fetchExpenses = useCallback(async () => {
    setExpensesState('loading');
    try {
      const result = await listExpenses({ page: expensesPage, pageSize: PAGE_SIZE });
      setExpenses(result.expenses);
      setExpensesTotal(result.totalItems);
      setExpensesState('ready');
    } catch {
      setExpensesState('error');
    }
  }, [expensesPage]);

  const fetchFeeTypes = useCallback(async () => {
    setFeeTypesState('loading');
    try {
      setFeeTypes(await listFeeTypes());
      setFeeTypesState('ready');
    } catch {
      setFeeTypesState('error');
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchFeeTypes();
  }, [fetchFeeTypes]);

  useEffect(() => {
    if (!canManage) return;
    Promise.all([listMemberOptions(), listFeeTypeOptions()])
      .then(([members, feeTypeOpts]) => {
        setMemberOptions(members);
        setFeeTypeOptions(feeTypeOpts);
      })
      .catch(() => showToast('Could not load members/fee types for recording a payment.', 'error'));
    // Loaded once — the picker only needs to be fresh when a modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  async function handleRecordPayment(values: PaymentFormValues) {
    await recordPayment(values);
    showToast('Payment recorded.', 'success');
    // Fee Types' payment-count column (the delete-usage-guard) depends on this too.
    await Promise.all([fetchPayments(), fetchOverview(), fetchFeeTypes()]);
  }

  async function handleRecordExpense(values: ExpenseFormValues) {
    await recordExpense(values);
    showToast('Expense recorded.', 'success');
    await Promise.all([fetchExpenses(), fetchOverview()]);
  }

  async function handleCreateFeeType(values: FeeTypeFormValues) {
    await createFeeType(values);
    // FeeTypesPanel shows its own create/update/delete toasts (matching 1.6's
    // CategoryPanel precedent) — this handler only owns the service call + refetch.
    await fetchFeeTypes();
  }

  async function handleUpdateFeeType(id: string, values: FeeTypeFormValues) {
    await updateFeeType(id, values);
    await fetchFeeTypes();
  }

  async function handleDeleteFeeType(id: string) {
    await deleteFeeType(id);
    await fetchFeeTypes();
  }

  return (
    <div>
      <div className="mb-4">
        <Tabs items={FINANCE_TABS} activeId={activeTab} onChange={(id) => setActiveTab(id as FinanceTabId)} ariaLabel="Finance sections" />
      </div>

      {activeTab === 'overview' ? (
        <FinanceOverviewPanel viewState={overviewState} overview={overview} onRetry={fetchOverview} />
      ) : null}

      {activeTab === 'payments' ? (
        <PaymentsPanel
          viewState={paymentsState}
          payments={payments}
          page={paymentsPage}
          pageSize={PAGE_SIZE}
          totalItems={paymentsTotal}
          onPageChange={setPaymentsPage}
          memberOptions={memberOptions}
          feeTypeOptions={feeTypeOptions}
          canManage={canManage}
          onRetry={fetchPayments}
          onRecordPayment={handleRecordPayment}
          feeTypes={feeTypes}
          search={paymentsSearch}
          onSearchChange={setPaymentsSearch}
          feeTypeFilter={paymentsFeeTypeFilter}
          onFeeTypeFilterChange={setPaymentsFeeTypeFilter}
          methodFilter={paymentsMethodFilter}
          onMethodFilterChange={setPaymentsMethodFilter}
          statusFilter={paymentsStatusFilter}
          onStatusFilterChange={setPaymentsStatusFilter}
        />
      ) : null}

      {activeTab === 'expenses' ? (
        <ExpensesPanel
          viewState={expensesState}
          expenses={expenses}
          page={expensesPage}
          pageSize={PAGE_SIZE}
          totalItems={expensesTotal}
          onPageChange={setExpensesPage}
          canManage={canManage}
          onRetry={fetchExpenses}
          onRecordExpense={handleRecordExpense}
        />
      ) : null}

      {activeTab === 'fee-types' ? (
        <FeeTypesPanel
          viewState={feeTypesState}
          feeTypes={feeTypes}
          canManage={canManage}
          onRetry={fetchFeeTypes}
          onCreate={handleCreateFeeType}
          onUpdate={handleUpdateFeeType}
          onDelete={handleDeleteFeeType}
        />
      ) : null}
    </div>
  );
}
