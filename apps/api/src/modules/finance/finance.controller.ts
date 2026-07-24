import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { createExpenseSchema, createFeeTypeSchema, createPaymentSchema, listExpensesQuerySchema, listPaymentsQuerySchema, updateFeeTypeSchema } from './finance.schema';
import { financeService } from './finance.service';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const financeController = {
  async listMemberOptions(_req: Request, res: Response): Promise<void> {
    const result = await financeService.listMemberOptions();
    sendSuccess(res, result);
  },

  async getSummaries(_req: Request, res: Response): Promise<void> {
    const result = await financeService.getSummaries();
    sendSuccess(res, result);
  },

  // Fee types
  async listFeeTypes(_req: Request, res: Response): Promise<void> {
    const result = await financeService.listFeeTypes();
    sendSuccess(res, result);
  },
  async createFeeType(req: Request, res: Response): Promise<void> {
    const input = createFeeTypeSchema.parse(req.body);
    const feeType = await financeService.createFeeType(input);
    sendSuccess(res, { feeType }, 201);
  },
  async updateFeeType(req: Request, res: Response): Promise<void> {
    const input = updateFeeTypeSchema.parse(req.body);
    const feeType = await financeService.updateFeeType(req.params['id']!, input);
    sendSuccess(res, { feeType });
  },
  async deleteFeeType(req: Request, res: Response): Promise<void> {
    await financeService.deleteFeeType(req.params['id']!);
    sendSuccess(res, { deleted: true });
  },

  // Payments
  async listPayments(req: Request, res: Response): Promise<void> {
    const query = listPaymentsQuerySchema.parse(req.query);
    const { payments, meta } = await financeService.listPayments(query);
    sendSuccess(res, { payments }, 200, meta);
  },
  async createPayment(req: Request, res: Response): Promise<void> {
    const input = createPaymentSchema.parse(req.body);
    const payment = await financeService.createPayment(input, req.user!.id);
    sendSuccess(res, { payment }, 201);
  },

  // Expenses
  async listExpenses(req: Request, res: Response): Promise<void> {
    const query = listExpensesQuerySchema.parse(req.query);
    const { expenses, meta } = await financeService.listExpenses(query);
    sendSuccess(res, { expenses }, 200, meta);
  },
  async createExpense(req: Request, res: Response): Promise<void> {
    const input = createExpenseSchema.parse(req.body);
    const expense = await financeService.createExpense(input, req.user!.id);
    sendSuccess(res, { expense }, 201);
  },
};
