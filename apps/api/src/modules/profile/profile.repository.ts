import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';

const userWithRoleInclude = {
  userRoles: { include: { role: true } },
} satisfies Prisma.UserInclude;

export type UserWithRole = Prisma.UserGetPayload<{ include: typeof userWithRoleInclude }>;

export const profileRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: userWithRoleInclude });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  update(id: string, data: { fullName: string; email: string; phoneNumber: string | null }) {
    return prisma.user.update({ where: { id }, data, include: userWithRoleInclude });
  },

  setPasswordHash(id: string, passwordHash: string) {
    return prisma.user.update({ where: { id }, data: { passwordHash } });
  },
};
