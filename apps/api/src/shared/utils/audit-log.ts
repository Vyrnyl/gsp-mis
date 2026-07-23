import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';

export interface WriteAuditLogInput {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Prisma.InputJsonValue;
}

/**
 * First writer to `audit_logs` (feature 1.4) — approvals/rejections are the first
 * critical actions in the app that need a trail. Fire-and-forget from the caller's
 * perspective is not appropriate here: an unaudited approval is a compliance gap,
 * so callers `await` this alongside the state change rather than treating it as
 * best-effort logging.
 */
export function writeAuditLog(input: WriteAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      details: input.details,
    },
  });
}
