import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/utils/api-response';
import { eventsService } from './events.service';
import {
  createEventSchema,
  listEventsQuerySchema,
  registerParticipantSchema,
  updateEventSchema,
  updateRegistrationStatusSchema,
} from './events.schema';

/** Thin controller — request/response mapping only (code-standards.md §6.2). */
export const eventsController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listEventsQuerySchema.parse(req.query);
    const { events, meta } = await eventsService.list(query);
    sendSuccess(res, { events }, 200, meta);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const event = await eventsService.getById(req.params['id']!);
    sendSuccess(res, { event });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createEventSchema.parse(req.body);
    const event = await eventsService.create(input);
    sendSuccess(res, { event }, 201);
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = updateEventSchema.parse(req.body);
    const event = await eventsService.update(req.params['id']!, input);
    sendSuccess(res, { event });
  },

  async delete(req: Request, res: Response): Promise<void> {
    await eventsService.delete(req.params['id']!);
    sendSuccess(res, { deleted: true });
  },

  async listParticipants(req: Request, res: Response): Promise<void> {
    const { participants, summary } = await eventsService.listParticipants(req.params['id']!);
    sendSuccess(res, { participants, summary });
  },

  async registerParticipant(req: Request, res: Response): Promise<void> {
    const input = registerParticipantSchema.parse(req.body);
    const participant = await eventsService.registerParticipant(req.params['id']!, input, req.user!.id);
    sendSuccess(res, { participant }, 201);
  },

  async updateRegistrationStatus(req: Request, res: Response): Promise<void> {
    const input = updateRegistrationStatusSchema.parse(req.body);
    const participant = await eventsService.updateRegistrationStatus(
      req.params['id']!,
      req.params['memberId']!,
      input,
    );
    sendSuccess(res, { participant });
  },
};
