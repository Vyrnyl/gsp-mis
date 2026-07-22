/**
 * Reads a JWT's `exp` claim without verifying the signature — used only to size an
 * httpOnly cookie's `maxAge`. Safe here because the BFF is decoding a token it just
 * received directly from the API over a private connection; verification is the
 * API's job (`shared/utils/jwt.ts` on that side).
 */
export function getJwtExpirySeconds(token: string): number {
  const payloadSegment = token.split('.')[1];
  if (!payloadSegment) return 0;

  const json = Buffer.from(payloadSegment, 'base64url').toString('utf8');
  const payload = JSON.parse(json) as { exp?: number };
  if (!payload.exp) return 0;

  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}
