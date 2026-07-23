import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { membersService } from './members.service';
import {
  createMemberSchema,
  listMembersQuerySchema,
  pendingMembersQuerySchema,
  rejectMemberSchema,
  renewMembershipSchema,
  updateMemberSchema,
} from './members.schema';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const membersController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listMembersQuerySchema.parse(req.query);
    const { members, meta } = await membersService.list(query);
    sendSuccess(res, { members }, 200, meta);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const member = await membersService.getById(req.params['id']!);
    sendSuccess(res, { member });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createMemberSchema.parse(req.body);
    const member = await membersService.create(input);
    sendSuccess(res, { member }, 201);
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = updateMemberSchema.parse(req.body);
    const member = await membersService.update(req.params['id']!, input);
    sendSuccess(res, { member });
  },

  async archive(req: Request, res: Response): Promise<void> {
    const member = await membersService.archive(req.params['id']!);
    sendSuccess(res, { member });
  },

  async restore(req: Request, res: Response): Promise<void> {
    const member = await membersService.restore(req.params['id']!);
    sendSuccess(res, { member });
  },

  async renew(req: Request, res: Response): Promise<void> {
    const input = renewMembershipSchema.parse(req.body);
    const member = await membersService.renew(req.params['id']!, input);
    sendSuccess(res, { member });
  },

  async listPending(req: Request, res: Response): Promise<void> {
    const query = pendingMembersQuerySchema.parse(req.query);
    const { members, meta } = await membersService.listPending(query);
    sendSuccess(res, { members }, 200, meta);
  },

  async approve(req: Request, res: Response): Promise<void> {
    const member = await membersService.approve(req.params['id']!, req.user!.id);
    sendSuccess(res, { member });
  },

  async reject(req: Request, res: Response): Promise<void> {
    const input = rejectMemberSchema.parse(req.body);
    const member = await membersService.reject(req.params['id']!, req.user!.id, input.reason);
    sendSuccess(res, { member });
  },
};
