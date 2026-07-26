import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { v1Routes } from './routes/v1';
import { errorHandler, notFoundHandler } from './shared/handlers/error-handler';

/**
 * Express application wiring — no listening happens here, so tests can import the app
 * directly (`supertest(app)`) without binding a port. `server.ts` owns the socket.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // Render (and most PaaS hosts) sit behind a single reverse-proxy hop that sets
  // X-Forwarded-For; without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
  // on every request in production. `1` trusts exactly one hop rather than the whole chain
  // (`true` would let a client spoof its own IP and bypass rate limiting).
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      // The BFF holds the httpOnly cookies and calls the API with a bearer token;
      // the API itself is stateless and sets no cookies (project-overview.md → Auth).
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/v1', v1Routes);

  // Order matters: unmatched routes become a 404 error, then the single error
  // handler formats every failure (code-standards.md §6.5).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
