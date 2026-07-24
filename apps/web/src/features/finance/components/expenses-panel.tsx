'use client';

import { useState } from 'react';

import { AddIcon } from '@/shared/components/icons';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Pagination,
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

import type { ExpenseFormValues, ExpenseSummary, ViewState } from '../types';
import { ExpenseFormModal } from './expense-form-modal';

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface ExpensesPanelProps {
  viewState: ViewState;
  expenses: ExpenseSummary[];
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  canManage: boolean;
  onRetry: () => void;
  onRecordExpense: (values: ExpenseFormValues) => Promise<void>;
}

export function ExpensesPanel({
  viewState,
  expenses,
  page,
  pageSize,
  totalItems,
  onPageChange,
  canManage,
  onRetry,
  onRecordExpense,
}: ExpensesPanelProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function handleSubmit(values: ExpenseFormValues) {
    await onRecordExpense(values);
    setIsFormOpen(false);
  }

  return (
    <Card>
      <CardHeader
        title="Expenses"
        subtitle={viewState === 'ready' ? `${totalItems.toLocaleString()} recorded` : undefined}
        actions={
          canManage ? (
            <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setIsFormOpen(true)}>
              Record Expense
            </Button>
          ) : undefined
        }
      />

      {viewState === 'loading' ? <TableSkeleton rows={4} columns={5} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={onRetry} description="We could not load expenses. Check your connection and try again." />
      ) : null}

      {viewState === 'ready' && expenses.length === 0 ? (
        <EmptyState
          title="No expenses recorded yet"
          description="Expenses approved for the council or a troop will appear here."
          action={
            canManage ? (
              <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setIsFormOpen(true)}>
                Record Expense
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {viewState === 'ready' && expenses.length > 0 ? (
        <>
          <TableWrapper>
            <Table caption="Recorded expenses">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell>Amount</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Approved By</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-semibold text-ink">{expense.description}</TableCell>
                    <TableCell>
                      {expense.category ? <Badge tone="gray">{expense.category}</Badge> : <span className="text-muted">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap font-semibold text-ink">{formatCurrency(expense.amount)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap">{toDisplayDate(expense.expenseDate)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap">{expense.approvedByName ?? '—'}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>

          <Pagination
            className="mt-4"
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={onPageChange}
            itemLabel="expenses"
          />
        </>
      ) : null}

      {canManage ? (
        <ExpenseFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleSubmit} />
      ) : null}
    </Card>
  );
}
