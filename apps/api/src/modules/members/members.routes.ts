import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { membersController } from './members.controller';

const router = Router();

/**
 * All three roles hold `members:read`/`members:write` — archive/restore is
 * `members:archive` and the approval queue/approve/reject is `members:approve`
 * (both admin + executive council only, per `shared/constants/roles.ts`).
 */
const anyRole = requireRole('admin', 'executive_council', 'troop_leader');
const canArchive = requireRole('admin', 'executive_council');
const canApprove = requireRole('admin', 'executive_council');

router.use(requireAuth);

// `/pending` must be mounted before `/:id` — otherwise Express would match it as
// `GET /:id` with id="pending" and Prisma would reject the non-UUID lookup.
router.get('/pending', canApprove, asyncHandler(membersController.listPending));

router.get('/', anyRole, asyncHandler(membersController.list));
router.post('/', anyRole, asyncHandler(membersController.create));
router.get('/:id', anyRole, asyncHandler(membersController.getById));
router.put('/:id', anyRole, asyncHandler(membersController.update));
router.patch('/:id/archive', canArchive, asyncHandler(membersController.archive));
router.patch('/:id/restore', canArchive, asyncHandler(membersController.restore));
router.post('/:id/renew', anyRole, asyncHandler(membersController.renew));
router.patch('/:id/approve', canApprove, asyncHandler(membersController.approve));
router.patch('/:id/reject', canApprove, asyncHandler(membersController.reject));

export const membersRoutes = router;
