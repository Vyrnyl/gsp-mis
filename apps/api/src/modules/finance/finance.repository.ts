import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';
import type {
  CreateExpenseInput,
  CreateFeeTypeInput,
  CreatePaymentInput,
  ListPaymentsQuery,
  UpdateFeeTypeInput,
} from './finance.schema';

function buildPaymentsWhere(query: ListPaymentsQuery): Prisma.PaymentWhereInput {
  const where: Prisma.PaymentWhereInput = {};

  if (query.feeTypeId) where.feeTypeId = query.feeTypeId;
  if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
  if (query.status) where.status = query.status;
  if (query.search) {
    const term = query.search.trim();
    where.member = {
      OR: [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
      ],
    };
  }

  return where;
}

const paymentInclude = {
  member: { include: { troop: true } },
  feeType: true,
  receivedBy: true,
} satisfies Prisma.PaymentInclude;
const expenseInclude = { approvedBy: true } satisfies Prisma.ExpenseInclude;
const feeTypeInclude = { _count: { select: { payments: true } } } satisfies Prisma.FeeTypeInclude;

export type PaymentWithRelations = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>;
export type ExpenseWithRelations = Prisma.ExpenseGetPayload<{ include: typeof expenseInclude }>;
export type FeeTypeWithCount = Prisma.FeeTypeGetPayload<{ include: typeof feeTypeInclude }>;

export const financeRepository = {
  // Member options (payment-recording picker) — `expiring` still counts as a
  // current member (renewal due within 30 days, not yet lapsed), same convention
  // as badges' `listMemberOptions`; `pending`/`expired`/`archived`/`rejected` excluded.
  listMemberOptions() {
    return prisma.member.findMany({
      where: { status: { name: { in: ['active', 'expiring'] } } },
      include: { troop: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  },

  findMemberById(id: string) {
    return prisma.member.findUnique({ where: { id } });
  },

  // Fee types
  listFeeTypes() {
    return prisma.feeType.findMany({ include: feeTypeInclude, orderBy: { name: 'asc' } });
  },
  findFeeTypeByName(name: string) {
    return prisma.feeType.findUnique({ where: { name } });
  },
  findFeeTypeById(id: string) {
    return prisma.feeType.findUnique({ where: { id }, include: feeTypeInclude });
  },
  createFeeType(input: CreateFeeTypeInput) {
    return prisma.feeType.create({
      data: { name: input.name.trim(), amount: input.amount, description: input.description?.trim() || null },
      include: feeTypeInclude,
    });
  },
  updateFeeType(id: string, input: UpdateFeeTypeInput) {
    return prisma.feeType.update({
      where: { id },
      data: { name: input.name.trim(), amount: input.amount, description: input.description?.trim() || null },
      include: feeTypeInclude,
    });
  },
  deleteFeeType(id: string) {
    return prisma.feeType.delete({ where: { id } });
  },

  // Payments
  async listPayments(query: ListPaymentsQuery): Promise<{ rows: PaymentWithRelations[]; total: number }> {
    const where = buildPaymentsWhere(query);
    const [rows, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: paymentInclude,
        orderBy: { paymentDate: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.payment.count({ where }),
    ]);
    return { rows, total };
  },
  createPayment(input: CreatePaymentInput, receivedById: string) {
    return prisma.payment.create({
      data: {
        memberId: input.memberId,
        feeTypeId: input.feeTypeId,
        amount: input.amount,
        paymentDate: new Date(input.paymentDate),
        paymentMethod: input.paymentMethod,
        status: input.status,
        receivedById,
      },
      include: paymentInclude,
    });
  },

  // Expenses
  async listExpenses(page: number, pageSize: number): Promise<{ rows: ExpenseWithRelations[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.expense.findMany({
        include: expenseInclude,
        orderBy: { expenseDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.expense.count(),
    ]);
    return { rows, total };
  },
  createExpense(input: CreateExpenseInput, approvedById: string) {
    return prisma.expense.create({
      data: {
        description: input.description.trim(),
        amount: input.amount,
        expenseDate: new Date(input.expenseDate),
        category: input.category?.trim() || null,
        approvedById,
      },
      include: expenseInclude,
    });
  },

  // Summaries
  paymentsSince(since: Date) {
    return prisma.payment.findMany({
      where: { paymentDate: { gte: since }, status: 'paid' },
      select: { paymentDate: true, amount: true },
    });
  },
  expensesSince(since: Date) {
    return prisma.expense.findMany({
      where: { expenseDate: { gte: since } },
      select: { expenseDate: true, amount: true },
    });
  },
  totalIncome() {
    return prisma.payment.aggregate({ where: { status: 'paid' }, _sum: { amount: true } });
  },
  totalExpenses() {
    return prisma.expense.aggregate({ _sum: { amount: true } });
  },
  countPendingPayments() {
    return prisma.payment.count({ where: { status: 'pending' } });
  },
  expensesByCategory() {
    return prisma.expense.groupBy({ by: ['category'], _sum: { amount: true } });
  },
  /** Exactly one seeded period today (`FY 2026`) — the most recent one stands in for
   * "the current period" until Phase 3 ever needs multi-period selection. */
  currentPeriod() {
    return prisma.financialPeriod.findFirst({ orderBy: { startDate: 'desc' } });
  },
};
