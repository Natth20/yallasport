'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { isEntityId } from '@/lib/security/http';
import { swallow } from '@/lib/ops/caught';

const tvRoles = new Set(['SUPER_ADMIN', 'EDITOR']);

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.role || !tvRoles.has(session.user.role)) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function linkMatchChannel(formData: FormData) {
  const session = await assertAdmin();

  const matchId = String(formData.get('matchId') || '');
  const channelId = String(formData.get('channelId') || '');
  if (!isEntityId(matchId) || !isEntityId(channelId)) return;

  await prisma.matchChannel.upsert({
    where: { matchId_channelId: { matchId, channelId } },
    update: {},
    create: { matchId, channelId },
  });

  if (session.user.id) {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TV_CHANNEL_LINK',
        entityType: 'MatchChannel',
        entityId: matchId,
      },
    }).catch(swallow('admin.auditLog', undefined));
  }

  revalidatePath('/admin/tv-guide');
  revalidatePath('/channels');
  revalidatePath(`/match/${matchId}`);
}

export async function unlinkMatchChannel(formData: FormData) {
  const session = await assertAdmin();

  const matchId = String(formData.get('matchId') || '');
  const channelId = String(formData.get('channelId') || '');
  if (!isEntityId(matchId) || !isEntityId(channelId)) return;

  await prisma.matchChannel.deleteMany({
    where: { matchId, channelId },
  }).catch(swallow('admin.unlinkMatchChannel', undefined));

  if (session.user.id) {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TV_CHANNEL_UNLINK',
        entityType: 'MatchChannel',
        entityId: matchId,
      },
    }).catch(swallow('admin.auditLog', undefined));
  }

  revalidatePath('/admin/tv-guide');
  revalidatePath('/channels');
  revalidatePath(`/match/${matchId}`);
}

export async function setMatchCommentator(formData: FormData) {
  const session = await assertAdmin();

  const matchId = String(formData.get('matchId') || '');
  const name = String(formData.get('name') || '').trim();
  const role = String(formData.get('role') || 'MAIN').trim();
  if (!isEntityId(matchId) || !name) return;

  await prisma.matchCommentator.upsert({
    where: { matchId_name: { matchId, name } },
    update: { role },
    create: { matchId, name, role },
  }).catch(swallow('admin.setMatchCommentator', undefined));

  if (session.user.id) {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TV_COMMENTATOR_SET',
        entityType: 'MatchCommentator',
        entityId: matchId,
      },
    }).catch(swallow('admin.auditLog', undefined));
  }

  revalidatePath('/admin/tv-guide');
  revalidatePath('/channels');
  revalidatePath(`/match/${matchId}`);
}

export async function createChannel(formData: FormData) {
  const session = await assertAdmin();

  const name = String(formData.get('name') || '').trim();
  const country = String(formData.get('country') || '').trim() || null;
  const logoUrl = String(formData.get('logoUrl') || '').trim() || null;
  if (!name) return;

  await prisma.channel.create({
    data: {
      name,
      country,
      logoUrl,
      kind: 'SPORTS',
    },
  }).catch(swallow('admin.createChannel', undefined));

  if (session.user.id) {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TV_CHANNEL_CREATE',
        entityType: 'Channel',
        entityId: name,
      },
    }).catch(swallow('admin.auditLog', undefined));
  }

  revalidatePath('/admin/tv-guide');
  revalidatePath('/channels');
}
