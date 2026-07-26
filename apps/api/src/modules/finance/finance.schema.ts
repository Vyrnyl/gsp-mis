import { z } from 'zod';

/**
 * Request validation for the finance module (Feature 3.1, Loop step 3 — Contract).
 *
 * Mirrored by hand in `apps/web/src/features/finance/types.ts` — same cross-workspace
 * convention as `members.schema.ts` / `organizations.schema.ts`.
 *
 * Contracted routes (mounted under `/api/v1/finance`):
 *   GET    /summaries          — no query
 *   GET    /member-options      — no query
 *   GET    /payments            — listPaymentsQuerySchema (search matches member name; feeTypeId/paymentMethod/status are exact filters)
 *   POST   /payments            — createPaymentSchema
 *   GET    /expenses            — listExpensesQuerySchema
 *   POST   /expenses            — createExpenseSchema
 *   GET    /fee-types           — no query
 *   POST   /fee-types           — createFeeTypeSchema
 *   PUT    /fee-types/:id       — updateFeeTypeSchema
 *   DELETE /fee-types/:id       — no body
 */

export const paymentMethodSchema = z.enum(['cash', 'bank_transfer', 'gcash', 'cheque']);
export const paymentStatusSchema = z.enum(['pending', 'paid', 'refunded', 'cancelled']);

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  feeTypeId: z.string().uuid().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  status: paymentStatusSchema.optional(),
});
export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createPaymentSchema = z.object({
  memberId: z.string().uuid('Select a member.'),
  feeTypeId: z.string().uuid('Select a fee type.'),
  amount: z.coerce.number().positive('Enter an amount greater than 0.'),
  paymentDate: z.string().trim().min(1, 'Payment date is required.'),
  paymentMethod: paymentMethodSchema.default('cash'),
  status: paymentStatusSchema.default('paid'),
});

export const createExpenseSchema = z.object({
  description: z.string().trim().min(1, 'Description is required.'),
  amount: z.coerce.number().positive('Enter an amount greater than 0.'),
  expenseDate: z.string().trim().min(1, 'Expense date is required.'),
  category: z.string().trim().optional(),
});

export const createFeeTypeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  amount: z.coerce.number().positive('Enter an amount greater than 0.'),
  description: z.string().trim().optional(),
});
export const updateFeeTypeSchema = createFeeTypeSchema;

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateFeeTypeInput = z.infer<typeof createFeeTypeSchema>;
export type UpdateFeeTypeInput = z.infer<typeof updateFeeTypeSchema>;
