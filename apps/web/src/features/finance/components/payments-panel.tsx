'use client';

import { useState } from 'react';

import { AddIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Pagination,
  Table,
  TableAvatar,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
} from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format-currency';

import { PAYMENT_METHOD_LABELS } from '../constants';
import type { FeeTypeOption, MemberOption, PaymentFormValues, PaymentSummary, ViewState } from '../types';
import { PaymentFormModal } from './payment-form-modal';
import { PaymentStatusBadge } from './payment-status-badge';

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface PaymentsPanelProps {
  viewState: ViewState;
  payments: PaymentSummary[];
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  memberOptions: MemberOption[];
  feeTypeOptions: FeeTypeOption[];
  canManage: boolean;
  onRetry: () => void;
  onRecordPayment: (values: PaymentFormValues) => Promise<void>;
}

export function PaymentsPanel({
  viewState,
  payments,
  page,
  pageSize,
  totalItems,
  onPageChange,
  memberOptions,
  feeTypeOptions,
  canManage,
  onRetry,
  onRecordPayment,
}: PaymentsPanelProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function handleSubmit(values: PaymentFormValues) {
    await onRecordPayment(values);
    setIsFormOpen(false);
  }

  return (
    <Card>
      <CardHeader
        title="Payments"
        subtitle={viewState === 'ready' ? `${totalItems.toLocaleString()} recorded` : undefined}
        actions={
          canManage ? (
            <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setIsFormOpen(true)}>
              Record Payment
            </Button>
          ) : undefined
        }
      />

      {viewState === 'loading' ? <TableSkeleton rows={5} columns={6} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={onRetry} description="We could not load payments. Check your connection and try again." />
      ) : null}

      {viewState === 'ready' && payments.length === 0 ? (
        <EmptyState
          title="No payments recorded yet"
          description="Payments recorded against a member's fee will appear here."
          action={
            canManage ? (
              <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setIsFormOpen(true)}>
                Record Payment
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {viewState === 'ready' && payments.length > 0 ? (
        <>
          <TableWrapper>
            <Table caption="Recorded payments">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Member</TableHeaderCell>
                  <TableHeaderCell>Fee Type</TableHeaderCell>
                  <TableHeaderCell>Amount</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Method</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <TableAvatar name={payment.memberName} />
                        <div>
                          <p className="whitespace-nowrap font-semibold text-ink">{payment.memberName}</p>
                          <p className="whitespace-nowrap text-[0.78rem] text-muted">{payment.troopName ?? '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap">{payment.feeTypeName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap font-semibold text-ink">{formatCurrency(payment.amount)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap">{toDisplayDate(payment.paymentDate)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap">{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</span>
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={payment.status} />
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
            itemLabel="payments"
          />
        </>
      ) : null}

      {canManage ? (
        <PaymentFormModal
          isOpen={isFormOpen}
          memberOptions={memberOptions}
          feeTypeOptions={feeTypeOptions}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </Card>
  );
}
