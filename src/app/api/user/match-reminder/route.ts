import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { matchId, action } = await request.json();
  if (!matchId || !['ADD', 'REMOVE'].includes(action)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const match = await prisma.match.findFirst({
    where: { OR: [{ id: matchId }, { externalId: matchId }] },
    select: { id: true },
  });
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  if (action === 'REMOVE') {
    await prisma.matchReminder.deleteMany({
      where: { userId: session.user.id, matchId: match.id },
    });
    return NextResponse.json({ success: true, active: false });
  }

  await prisma.matchReminder.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId: match.id } },
    update: {},
    create: { userId: session.user.id, matchId: match.id },
  });
  return NextResponse.json({ success: true, active: true });
}
