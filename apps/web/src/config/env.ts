/**
 * Origin of the Express API the BFF proxies to (next.config.mjs already rewrites
 * `/api/v1/:path*` here for simple reads; the auth route handlers under
 * `src/app/api/auth/` call it directly because they must translate the JSON
 * response's tokens into httpOnly cookies before anything reaches the browser).
 */
export const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:4000';
