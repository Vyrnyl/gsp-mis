import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { eventsController } from './events.controller';

const router = Router();

/**
 * All three roles hold `events:read` (Troop Leader only "views upcoming events" per
 * project-overview.md). Create/update/delete is Admin-only — Executive Council's
 * `events:write` grant was removed pre-build (confirmed 2026-07-23) since the role
 * matrix scopes event Create/Edit/Delete/"Assign troop leaders" to Administrator only.
 */
const anyRole = requireRole('admin', 'executive_council', 'troop_leader');
const canManage = requireRole('admin');

/**
 * Registrations (Feature 2.2) use a separate gate: `attendance:write` covers Admin +
 * Troop Leader (who "register participants" per project-overview.md), not Executive
 * Council (monitoring-only) — same shape as `attendance:read`/`write` in roles.ts,
 * distinct from `canManage` above which is event CRUD (Admin only).
 */
const canManageRegistrations = requireRole('admin', 'troop_leader');

router.use(requireAuth);

router.get('/', anyRole, asyncHandler(eventsController.list));
router.post('/', canManage, asyncHandler(eventsController.create));
router.get('/:id', anyRole, asyncHandler(eventsController.getById));
router.put('/:id', canManage, asyncHandler(eventsController.update));
router.delete('/:id', canManage, asyncHandler(eventsController.delete));

router.get('/:id/registrations', anyRole, asyncHandler(eventsController.listParticipants));
router.post('/:id/registrations', canManageRegistrations, asyncHandler(eventsController.registerParticipant));
router.patch(
  '/:id/registrations/:memberId',
  canManageRegistrations,
  asyncHandler(eventsController.updateRegistrationStatus),
);

export const eventsRoutes = router;
