'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/admin/audit';
import type { UserRole } from '@/generated/prisma';
import { isEntityId } from '@/lib/security/http';
import { STAFF_ROLES } from '@/lib/auth/admin-access';

const ROLES: UserRole[] = ['USER', ...STAFF_ROLES];

function asRole(value: string): UserRole | null {
  return (ROLES as string[]).includes(value) ? (value as UserRole) : null;
}

export async function setUserRole(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }
  const userId = String(formData.get('userId') || '');
  const role = asRole(String(formData.get('role') || ''));
  if (!isEntityId(userId) || !role) return;
  if (userId === session.user.id && role !== 'SUPER_ADMIN') return;

  const current = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!current) return;
  if (current.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
    const others = await prisma.user.count({
      where: { role: 'SUPER_ADMIN', NOT: { id: userId } },
    });
    if (others === 0) return;
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  await writeAudit(session.user.id, 'USER_ROLE_CHANGE', 'User', userId);
  revalidatePath('/admin/users');
  revalidatePath('/ar/admin/users');
  revalidatePath('/en/admin/users');
}
