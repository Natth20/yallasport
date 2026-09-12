// src/app/api/user/favorite/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';

const entityTypes = ['TEAM', 'MATCH', 'LEAGUE'] as const;
type EntityType = (typeof entityTypes)[number];

async function resolveEntityId(entityType: EntityType, entityId: string) {
  if (entityType === 'MATCH') {
    const match = await prisma.match.findFirst({
      where: { OR: [{ id: entityId }, { externalId: entityId }] },
      select: { id: true },
    });
    return match?.id ?? null;
  }
  if (entityType === 'TEAM') {
    const team = await prisma.team.findFirst({
      where: { OR: [{ id: entityId }, { externalId: entityId }] },
      select: { id: true },
    });
    return team?.id ?? null;
  }
  const league = await prisma.league.findFirst({
    where: { OR: [{ id: entityId }, { externalId: entityId }] },
    select: { id: true },
  });
  return league?.id ?? null;
}

export const GET = auth(async function GET(req) {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favorites = await prisma.userFavorite.findMany({
    where: { userId: req.auth.user.id },
    orderBy: { id: 'desc' },
  });
  return NextResponse.json({ favorites });
});

export const POST = auth(async function POST(req) {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { entityId, entityType, action } = await req.json();

  if (!entityId || !entityTypes.includes(entityType)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    const resolvedId = await resolveEntityId(entityType, entityId);
    if (!resolvedId) return NextResponse.json({ error: 'Entity not found' }, { status: 404 });

    if (action === 'REMOVE') {
      await prisma.userFavorite.deleteMany({
        where: {
          userId: req.auth.user.id,
          entityType,
          entityId: resolvedId,
        },
      });
      return NextResponse.json({ success: true, removed: true });
    }

    const favorite = await prisma.userFavorite.upsert({
      where: {
        userId_entityType_entityId: {
          userId: req.auth.user.id,
          entityType,
          entityId: resolvedId
        }
      },
      update: {},
      create: {
        userId: req.auth.user.id,
        entityType,
        entityId: resolvedId
      }
    });

    return NextResponse.json({ success: true, favorite });
  } catch (error) {
    console.error('Favorite Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
