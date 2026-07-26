import { beforeEach, describe, expect, it, vi } from 'vitest';

import { financeRepository } from '../src/modules/finance/finance.repository';
import { financeService } from '../src/modules/finance/finance.service';
import type { CreateExpenseInput, CreateFeeTypeInput, CreatePaymentInput } from '../src/modules/finance/finance.schema';

function decimal(value: number) {
  return { toNumber: () => value };
}

const MEMBER = { id: 'member-1', firstName: 'Faith', lastName: 'Bermundo', troop: { name: 'Troop 4 — Bato' } };
const FEE_TYPE = {
  id: 'fee-1',
  name: 'Annual Membership Fee',
  amount: decimal(350),
  description: 'Yearly fee',
  _count: { payments: 0 },
};
const PAYMENT = {
  id: 'pay-1',
  memberId: MEMBER.id,
  member: MEMBER,
  feeTypeId: FEE_TYPE.id,
  feeType: FEE_TYPE,
  amount: decimal(350),
  paymentDate: new Date('2026-06-01T00:00:00Z'),
  paymentMethod: 'cash',
  status: 'paid',
  receivedBy: { fullName: 'Marisol Tabuena' },
};
const EXPENSE = {
  id: 'exp-1',
  description: 'Camp supplies',
  amount: decimal(12500),
  expenseDate: new Date('2026-06-10T00:00:00Z'),
  category: 'Camp',
  approvedBy: { fullName: 'Marisol Tabuena' },
};

describe('financeService member options', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('maps active members to member options', async () => {
    vi.spyOn(financeRepository, 'listMemberOptions').mockResolvedValue([MEMBER] as never);

    const result = await financeService.listMemberOptions();

    expect(result.members).toEqual([{ id: 'member-1', fullName: 'Faith Bermundo', troopName: 'Troop 4 — Bato' }]);
  });
});

describe('financeService fee types', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('lists fee types with payment counts mapped to the DTO', async () => {
    vi.spyOn(financeRepository, 'listFeeTypes').mockResolvedValue([FEE_TYPE] as never);

    const result = await financeService.listFeeTypes();

    expect(result.feeTypes).toEqual([
      { id: 'fee-1', name: 'Annual Membership Fee', amount: 350, description: 'Yearly fee', paymentCount: 0 },
    ]);
  });

  it('rejects creating a fee type with a name already in use', async () => {
    vi.spyOn(financeRepository, 'findFeeTypeByName').mockResolvedValue(FEE_TYPE as never);

    const input: CreateFeeTypeInput = { name: 'Annual Membership Fee', amount: 350, description: undefined };
    await expect(financeService.createFeeType(input)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('creates a fee type when the name is free', async () => {
    vi.spyOn(financeRepository, 'findFeeTypeByName').mockResolvedValue(null);
    const createSpy = vi.spyOn(financeRepository, 'createFeeType').mockResolvedValue(FEE_TYPE as never);

    const input: CreateFeeTypeInput = { name: 'Camp Fee', amount: 450, description: undefined };
    const result = await financeService.createFeeType(input);

    expect(createSpy).toHaveBeenCalledWith(input);
    expect(result.name).toBe(FEE_TYPE.name);
  });

  it('rejects updating a fee type that does not exist', async () => {
    vi.spyOn(financeRepository, 'findFeeTypeById').mockResolvedValue(null);

    await expect(
      financeService.updateFeeType('missing', { name: 'X', amount: 1, description: undefined }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('blocks deleting a fee type still in use by payments', async () => {
    vi.spyOn(financeRepository, 'findFeeTypeById').mockResolvedValue({
      ...FEE_TYPE,
      _count: { payments: 5 },
    } as never);

    await expect(financeService.deleteFeeType(FEE_TYPE.id)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('deletes a fee type with no payments recorded against it', async () => {
    vi.spyOn(financeRepository, 'findFeeTypeById').mockResolvedValue(FEE_TYPE as never);
    const deleteSpy = vi.spyOn(financeRepository, 'deleteFeeType').mockResolvedValue(FEE_TYPE as never);

    await financeService.deleteFeeType(FEE_TYPE.id);

    expect(deleteSpy).toHaveBeenCalledWith(FEE_TYPE.id);
  });
});

describe('financeService payments', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('lists payments with pagination meta', async () => {
    vi.spyOn(financeRepository, 'listPayments').mockResolvedValue({ rows: [PAYMENT], total: 1 } as never);

    const result = await financeService.listPayments({ page: 1, pageSize: 20 });

    expect(result.payments).toEqual([
      {
        id: 'pay-1',
        memberId: 'member-1',
        memberName: 'Faith Bermundo',
        troopName: 'Troop 4 — Bato',
        feeTypeId: 'fee-1',
        feeTypeName: 'Annual Membership Fee',
        amount: 350,
        paymentDate: '2026-06-01',
        paymentMethod: 'cash',
        status: 'paid',
        receivedByName: 'Marisol Tabuena',
      },
    ]);
    expect(result.meta).toEqual({ page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
  });

  it('forwards search/feeTypeId/paymentMethod/status filters to the repository', async () => {
    const listSpy = vi.spyOn(financeRepository, 'listPayments').mockResolvedValue({ rows: [PAYMENT], total: 1 } as never);

    const query = {
      page: 1,
      pageSize: 20,
      search: 'Faith',
      feeTypeId: FEE_TYPE.id,
      paymentMethod: 'cash' as const,
      status: 'paid' as const,
    };
    await financeService.listPayments(query);

    expect(listSpy).toHaveBeenCalledWith(query);
  });

  it('rejects recording a payment for a member that does not exist', async () => {
    vi.spyOn(financeRepository, 'findMemberById').mockResolvedValue(null);

    const input: CreatePaymentInput = {
      memberId: 'missing',
      feeTypeId: FEE_TYPE.id,
      amount: 350,
      paymentDate: '2026-06-01',
      paymentMethod: 'cash',
      status: 'paid',
    };
    await expect(financeService.createPayment(input, 'user-1')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects recording a payment against a fee type that does not exist', async () => {
    vi.spyOn(financeRepository, 'findMemberById').mockResolvedValue(MEMBER as never);
    vi.spyOn(financeRepository, 'findFeeTypeById').mockResolvedValue(null);

    const input: CreatePaymentInput = {
      memberId: MEMBER.id,
      feeTypeId: 'missing',
      amount: 350,
      paymentDate: '2026-06-01',
      paymentMethod: 'cash',
      status: 'paid',
    };
    await expect(financeService.createPayment(input, 'user-1')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('records a payment when the member and fee type both exist', async () => {
    vi.spyOn(financeRepository, 'findMemberById').mockResolvedValue(MEMBER as never);
    vi.spyOn(financeRepository, 'findFeeTypeById').mockResolvedValue(FEE_TYPE as never);
    const createSpy = vi.spyOn(financeRepository, 'createPayment').mockResolvedValue(PAYMENT as never);

    const input: CreatePaymentInput = {
      memberId: MEMBER.id,
      feeTypeId: FEE_TYPE.id,
      amount: 350,
      paymentDate: '2026-06-01',
      paymentMethod: 'cash',
      status: 'paid',
    };
    const result = await financeService.createPayment(input, 'user-1');

    expect(createSpy).toHaveBeenCalledWith(input, 'user-1');
    expect(result.amount).toBe(350);
  });
});

describe('financeService expenses', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('lists expenses with pagination meta', async () => {
    vi.spyOn(financeRepository, 'listExpenses').mockResolvedValue({ rows: [EXPENSE], total: 1 } as never);

    const result = await financeService.listExpenses({ page: 1, pageSize: 20 });

    expect(result.expenses).toEqual([
      {
        id: 'exp-1',
        description: 'Camp supplies',
        amount: 12500,
        expenseDate: '2026-06-10',
        category: 'Camp',
        approvedByName: 'Marisol Tabuena',
      },
    ]);
    expect(result.meta).toEqual({ page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
  });

  it('records an expense', async () => {
    const createSpy = vi.spyOn(financeRepository, 'createExpense').mockResolvedValue(EXPENSE as never);

    const input: CreateExpenseInput = {
      description: 'Camp supplies',
      amount: 12500,
      expenseDate: '2026-06-10',
      category: 'Camp',
    };
    const result = await financeService.createExpense(input, 'user-1');

    expect(createSpy).toHaveBeenCalledWith(input, 'user-1');
    expect(result.amount).toBe(12500);
  });
});

describe('financeService summaries', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('computes stats, monthly trend and category breakdown from live records', async () => {
    vi.spyOn(financeRepository, 'totalIncome').mockResolvedValue({ _sum: { amount: decimal(2100) } } as never);
    vi.spyOn(financeRepository, 'totalExpenses').mockResolvedValue({ _sum: { amount: decimal(20500) } } as never);
    vi.spyOn(financeRepository, 'countPendingPayments').mockResolvedValue(1);
    vi.spyOn(financeRepository, 'expensesByCategory').mockResolvedValue([
      { category: 'Camp', _sum: { amount: decimal(12500) } },
      { category: null, _sum: { amount: decimal(0) } },
    ] as never);
    vi.spyOn(financeRepository, 'paymentsSince').mockResolvedValue([
      { paymentDate: new Date(), amount: decimal(350) },
    ] as never);
    vi.spyOn(financeRepository, 'expensesSince').mockResolvedValue([
      { expenseDate: new Date(), amount: decimal(12500) },
    ] as never);
    vi.spyOn(financeRepository, 'currentPeriod').mockResolvedValue({
      id: 'period-1',
      name: 'FY 2026',
      startDate: new Date('2025-12-25T00:00:00Z'),
      endDate: new Date('2027-01-05T00:00:00Z'),
    } as never);

    const result = await financeService.getSummaries();

    expect(result.stats).toEqual([
      { id: 'income', label: 'Total Income', value: 2100 },
      { id: 'expenses', label: 'Total Expenses', value: 20500 },
      { id: 'balance', label: 'Council Balance', value: -18400 },
      { id: 'pendingPayments', label: 'Pending Payments', value: 1 },
    ]);
    expect(result.expenseByCategory).toEqual([{ category: 'Camp', amount: 12500 }]);
    expect(result.monthlyTrend).toHaveLength(6);
    expect(result.monthlyTrend.at(-1)).toMatchObject({ income: 350, expense: 12500 });
    expect(result.period).toEqual({
      id: 'period-1',
      name: 'FY 2026',
      startDate: '2025-12-25',
      endDate: '2027-01-05',
      totalIncome: 2100,
      totalExpense: 20500,
      balance: -18400,
    });
  });

  it('returns a null period when none is seeded', async () => {
    vi.spyOn(financeRepository, 'totalIncome').mockResolvedValue({ _sum: { amount: null } } as never);
    vi.spyOn(financeRepository, 'totalExpenses').mockResolvedValue({ _sum: { amount: null } } as never);
    vi.spyOn(financeRepository, 'countPendingPayments').mockResolvedValue(0);
    vi.spyOn(financeRepository, 'expensesByCategory').mockResolvedValue([] as never);
    vi.spyOn(financeRepository, 'paymentsSince').mockResolvedValue([] as never);
    vi.spyOn(financeRepository, 'expensesSince').mockResolvedValue([] as never);
    vi.spyOn(financeRepository, 'currentPeriod').mockResolvedValue(null);

    const result = await financeService.getSummaries();

    expect(result.period).toBeNull();
    expect(result.stats.find((s) => s.id === 'income')?.value).toBe(0);
  });
});
