import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { attendanceController } from './attendance.controller';

const router = Router();

/** Admin + Troop Leader "record attendance" per project-overview.md; Executive
 * Council monitors only (reads live on `events`'s `GET /:id/registrations` instead —
 * see attendance.schema.ts). Same role split as events' registration routes. */
const canRecord = requireRole('admin', 'troop_leader');

router.use(requireAuth);

router.post('/', canRecord, asyncHandler(attendanceController.record));

export const attendanceRoutes = router;
