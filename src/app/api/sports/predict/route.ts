import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';
import { writeRatelimit } from '@/lib/redis';
import { clientIp, isEntityId } from '@/lib/security/http';

const OUTCOMES = ['HOME_WIN', 'AWAY_WIN', 'DRAW'] as const;
type Outcome = (typeof OUTCOMES)[number];

function isOutcome(value: unknown): value is Outcome {
  return typeof value === 'string' && OUTCOMES.includes(value as Outcome);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const ip = clientIp(req);
  const { success } = await writeRatelimit.limit(`predict_${session.user.email}_${ip}`);
  if (!success) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const matchId = isEntityId(body?.matchId) ? body.matchId : '';
  const outcome = body?.outcome;

  if (!matchId || !isOutcome(outcome)) {
    return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const match = await prisma.match.findFirst({
      where: { OR: [{ id: matchId }, { externalId: matchId }] },
      select: { id: true },
    });
    if (!match) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: user.id,
          matchId: match.id
        }
      },
      update: {
        predictedOutcome: outcome
      },
      create: {
        userId: user.id,
        matchId: match.id,
        predictedOutcome: outcome
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SUBMIT_PREDICTION',
        entityType: 'MATCH',
        entityId: match.id
      }
    });

    return NextResponse.json({ success: true, prediction });
  } catch (error) {
    console.error('[PREDICT_ERROR]:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
