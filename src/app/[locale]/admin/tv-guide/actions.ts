'use server';
import { swallow } from '@/lib/ops/caught';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { isEntityId } from '@/lib/security/http';

const tvRoles = new Set(['SUPER_ADMIN', 'EDITOR']);

export async function linkMatchChannel(formData: FormData) {
  const session = await auth();
  if (!session?.user?.role || !tvRoles.has(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const matchId = String(formData.get('matchId') || '');
  const channelId = String(formData.get('channelId') || '');
  if (!isEntityId(matchId) || !isEntityId(channelId)) return;

  await prisma.matchChannel.upsert({
    where: { matchId_channelId: { matchId, channelId } },
    update: {},
    create: { matchId, channelId },
  });
  if (!session.user.id) return;
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'TV_CHANNEL_LINK',
      entityType: 'MatchChannel',
      entityId: matchId,
    },
  }).catch(swallow("src/app/[locale]/admin/tv-guide/actions.ts:33", undefined));

  revalidatePath('/admin/tv-guide');
  revalidatePath('/ar/admin/tv-guide');
  revalidatePath('/en/admin/tv-guide');
  revalidatePath(`/match/${matchId}`);
}
