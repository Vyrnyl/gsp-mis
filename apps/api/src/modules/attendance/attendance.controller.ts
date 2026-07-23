import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { attendanceService } from './attendance.service';
import { recordAttendanceSchema } from './attendance.schema';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const attendanceController = {
  async record(req: Request, res: Response): Promise<void> {
    const input = recordAttendanceSchema.parse(req.body);
    const record = await attendanceService.record(input, req.user!.id);
    sendSuccess(res, { record }, 201);
  },
};
