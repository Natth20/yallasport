'use server';
import { swallow } from '@/lib/ops/caught';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { isEntityId } from '@/lib/security/http';

const adRoles = new Set(['SUPER_ADMIN', 'ADS_MANAGER']);

export async function toggleAdSlot(formData: FormData) {
  const session = await auth();
  if (!session?.user?.role || !adRoles.has(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const id = String(formData.get('id') || '');
  if (!isEntityId(id)) return;

  const slot = await prisma.adSlot.findUnique({ where: { id }, select: { isActive: true } });
  if (!slot) return;

  await prisma.adSlot.update({
    where: { id },
    data: { isActive: !slot.isActive },
  });
  if (!session.user.id) return;
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: slot.isActive ? 'AD_SLOT_OFF' : 'AD_SLOT_ON',
      entityType: 'AdSlot',
      entityId: id,
    },
  }).catch(swallow("src/app/[locale]/admin/ads/actions.ts:34", undefined));

  revalidatePath('/admin/ads');
  revalidatePath('/ar/admin/ads');
  revalidatePath('/en/admin/ads');
}
