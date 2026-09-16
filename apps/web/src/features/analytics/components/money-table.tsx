import type { IconType } from '@/shared/components/icons';
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrapper,
} from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format-currency';

import type { MoneySlice } from '../types';

export interface MoneyTableProps {
  heading: string;
  caption: string;
  firstColumn: string;
  rows: MoneySlice[];
  emptyIcon: IconType;
  emptyTitle: string;
}

/**
 * One money breakdown table — label, amount, share of total.
 *
 * Lived inside `decision-support-panel.tsx` until the 2026-09-16 R4 revision, when the
 * Financial tab gained the same breakdowns on the tab that owns that data. Extracted
 * rather than copied: a second implementation would be a second place for the currency
 * formatting and the empty state to drift.
 */
export function MoneyTable({ heading, caption, firstColumn, rows, emptyIcon, emptyTitle }: MoneyTableProps) {
  return (
    <div>
      <h4 className="mb-2 text-[0.92rem] font-semibold text-ink">{heading}</h4>
      {rows.length > 0 ? (
        <TableWrapper>
          <Table caption={caption}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{firstColumn}</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Share</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell>{formatCurrency(row.amount)}</TableCell>
                  <TableCell>{row.share}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      ) : (
        <EmptyState icon={emptyIcon} title={emptyTitle} description="Nothing falls within the selected range." />
      )}
    </div>
  );
}
