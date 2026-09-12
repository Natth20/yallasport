'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { isEntityId } from '@/lib/security/http';

type DeskStatus = 'NEW' | 'READ' | 'ARCHIVED';

const inboxRoles = new Set(['SUPER_ADMIN', 'MODERATOR', 'EDITOR']);

async function assertInbox() {
  const session = await auth();
  if (!session?.user?.role || !inboxRoles.has(session.user.role)) {
    throw new Error('Unauthorized');
  }
}

export async function setDeskStatus(formData: FormData) {
  await assertInbox();
  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || '') as DeskStatus;
  if (!isEntityId(id) || !['NEW', 'READ', 'ARCHIVED'].includes(status)) return;

  await prisma.deskMessage.update({
    where: { id },
    data: {
      status,
      readAt: status === 'NEW' ? null : new Date(),
    },
  });

  revalidatePath('/admin/inbox');
  revalidatePath('/ar/admin/inbox');
  revalidatePath('/en/admin/inbox');
}
