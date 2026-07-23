import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { membersController } from './members.controller';

const router = Router();

/** All three roles hold `members:read`/`members:write` — archive/restore is `members:archive` (admin + executive council only). */
const anyRole = requireRole('admin', 'executive_council', 'troop_leader');
const canArchive = requireRole('admin', 'executive_council');

router.use(requireAuth);

router.get('/', anyRole, asyncHandler(membersController.list));
router.post('/', anyRole, asyncHandler(membersController.create));
router.get('/:id', anyRole, asyncHandler(membersController.getById));
router.put('/:id', anyRole, asyncHandler(membersController.update));
router.patch('/:id/archive', canArchive, asyncHandler(membersController.archive));
router.patch('/:id/restore', canArchive, asyncHandler(membersController.restore));
router.post('/:id/renew', anyRole, asyncHandler(membersController.renew));

export const membersRoutes = router;
