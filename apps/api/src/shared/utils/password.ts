import bcrypt from 'bcryptjs';

/** Matches `BCRYPT_ROUNDS` in `prisma/seed.ts` — keep the two in sync. */
const BCRYPT_ROUNDS = 10;

export function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_ROUNDS);
}

export function verifyPassword(plainText: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainText, passwordHash);
}
