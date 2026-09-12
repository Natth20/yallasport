'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma';

const adminRoles = new Set(['SUPER_ADMIN', 'EDITOR', 'CONTENT_MANAGER']);

async function assertEditor() {
  const session = await auth();
  if (!session?.user?.role || !adminRoles.has(session.user.role)) throw new Error('Unauthorized');
}

export async function saveMatchMetadata(matchId: string, formData: FormData) {
  await assertEditor();
  const venueName = String(formData.get('venue') || '').trim();
  const refereeName = String(formData.get('referee') || '').trim();
  const commentatorName = String(formData.get('commentator') || '').trim();
  const channelName = String(formData.get('channel') || '').trim();
  const data: Prisma.MatchUpdateInput = {};

  if (venueName) {
    const venue = await prisma.venue.findFirst({ where: { name: venueName } })
      ?? await prisma.venue.create({ data: { name: venueName } });
    data.venue = { connect: { id: venue.id } };
  }
  if (refereeName) {
    const referee = await prisma.referee.findFirst({ where: { name: refereeName } })
      ?? await prisma.referee.create({ data: { name: refereeName } });
    data.referee = { connect: { id: referee.id } };
  }

  await prisma.match.update({ where: { id: matchId }, data });
  if (commentatorName) {
    await prisma.matchCommentator.upsert({
      where: { matchId_name: { matchId, name: commentatorName } },
      update: {},
      create: { matchId, name: commentatorName, language: 'ar' },
    });
  }
  if (channelName) {
    const channel = await prisma.channel.findFirst({ where: { name: channelName } })
      ?? await prisma.channel.create({ data: { name: channelName } });
    await prisma.matchChannel.upsert({
      where: { matchId_channelId: { matchId, channelId: channel.id } },
      update: {},
      create: { matchId, channelId: channel.id },
    });
  }
  revalidatePath(`/admin/matches/${matchId}`);
  revalidatePath(`/match/${matchId}`);
}

export async function savePredictedLineup(matchId: string, teamId: string, formData: FormData) {
  await assertEditor();
  const formation = String(formData.get('formation') || '').trim();
  const rawPlayers = String(formData.get('players') || '[]');
  const parsed = JSON.parse(rawPlayers);
  if (!Array.isArray(parsed)) throw new Error('Players must be a JSON array');

  await prisma.matchLineup.upsert({
    where: {
      matchId_teamId_isPredicted: { matchId, teamId, isPredicted: true },
    },
    update: {
      formation: formation || null,
      playersJson: { players: parsed },
      source: 'EDITORIAL',
    },
    create: {
      matchId,
      teamId,
      formation: formation || null,
      playersJson: { players: parsed },
      isPredicted: true,
      source: 'EDITORIAL',
    },
  });
  revalidatePath(`/admin/matches/${matchId}`);
  revalidatePath(`/match/${matchId}`);
}
