import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { settingsController } from './settings.controller';

/**
 * Every route in this module is Administrator-only — `users:manage`,
 * `settings:manage` and `audit-logs:read` are all granted to `admin` alone
 * (`shared/constants/roles.ts`), matching project-overview.md's "System
 * Administration" and "User Management" sections having no Executive Council or
 * Troop Leader responsibilities at all. Unlike badges/finance/reports, there is no
 * `anyRole` read tier here.
 */
const canManage = requireRole('admin');

const settingsRouter = Router();
settingsRouter.use(requireAuth, canManage);
settingsRouter.get('/', asyncHandler(settingsController.getSettings));
settingsRouter.put('/', asyncHandler(settingsController.updateSettings));
settingsRouter.get('/backup', asyncHandler(settingsController.getBackupInfo));
settingsRouter.post('/backup', asyncHandler(settingsController.runBackup));

const usersRouter = Router();
usersRouter.use(requireAuth, canManage);
usersRouter.get('/', asyncHandler(settingsController.listUsers));
usersRouter.post('/', asyncHandler(settingsController.createUser));
usersRouter.patch('/:id', asyncHandler(settingsController.updateUser));
usersRouter.patch('/:id/status', asyncHandler(settingsController.setUserStatus));
usersRouter.post('/:id/reset-password', asyncHandler(settingsController.resetPassword));
usersRouter.delete('/:id', asyncHandler(settingsController.deleteUser));

const auditLogsRouter = Router();
auditLogsRouter.use(requireAuth, canManage);
auditLogsRouter.get('/', asyncHandler(settingsController.listAuditLogs));

export const settingsRoutes = settingsRouter;
export const usersRoutes = usersRouter;
export const auditLogsRoutes = auditLogsRouter;
