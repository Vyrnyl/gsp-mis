import type { AuthRoleId, DemoAccount } from '@/features/auth/types';

/**
 * Mirrors the demo accounts `apps/api/prisma/seed.ts` creates (password default
 * `GspDemo!2026`, overridable via `SEED_PASSWORD`). Login is wired to the real
 * `POST /api/v1/auth/login` (Loop step 4) — this fixture now only feeds the
 * "Fill Demo Credentials" button, not a simulated auth check.
 */
export const DEMO_ACCOUNTS: Record<AuthRoleId, DemoAccount> = {
  admin: {
    roleId: 'admin',
    name: 'Marisol Tabuena',
    email: 'admin@gsp-catanduanes.ph',
    password: 'GspDemo!2026',
  },
  executive_council: {
    roleId: 'executive_council',
    name: 'Rosario Verceles',
    email: 'council@gsp-catanduanes.ph',
    password: 'GspDemo!2026',
  },
  troop_leader: {
    roleId: 'troop_leader',
    name: 'Liza Bagadiong',
    email: 'leader.virac@gsp-catanduanes.ph',
    password: 'GspDemo!2026',
  },
};
